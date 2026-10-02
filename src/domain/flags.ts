import jsonLogic from 'json-logic-js'
import type { RulesLogic } from 'json-logic-js'
import murmurhash from 'murmurhash-js'
import { z } from 'zod'

const ruleSchema = z.object({
  id: z.string().min(1),
  attribute: z.enum(['country', 'plan', 'email', 'companySize']),
  operator: z.enum(['equals', 'contains', 'greaterThan']),
  value: z.string(),
  serve: z.boolean(),
})

const configSchema = z.object({
  enabled: z.boolean(),
  rollout: z.number().min(0).max(100),
  rules: z.array(ruleSchema),
})

export const flagSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  owner: z.string().min(1),
  updatedAt: z.iso.datetime(),
  environments: z.record(z.string(), configSchema),
})

export const flagWorkspaceSchema = z
  .object({
    flags: z.array(flagSchema).min(1),
    environmentNames: z.array(z.string().min(1)).min(1),
    sampleUsers: z
      .array(
        z.object({
          id: z.string().min(1),
          email: z.email(),
          country: z.string().min(1),
          plan: z.string().min(1),
          companySize: z.number().int().nonnegative(),
        }),
      )
      .min(1),
    audit: z.array(
      z.object({
        id: z.string().min(1),
        at: z.iso.datetime(),
        actor: z.string().min(1),
        message: z.string().min(1),
      }),
    ),
  })
  .superRefine((workspace, context) => {
    const environments = new Set(workspace.environmentNames)
    if (environments.size !== workspace.environmentNames.length) {
      context.addIssue({
        code: 'custom',
        path: ['environmentNames'],
        message: 'Environment names must be unique.',
      })
    }
    const flagIds = new Set(workspace.flags.map((flag) => flag.id))
    const flagKeys = new Set(workspace.flags.map((flag) => flag.key))
    if (flagIds.size !== workspace.flags.length || flagKeys.size !== workspace.flags.length) {
      context.addIssue({
        code: 'custom',
        path: ['flags'],
        message: 'Flag IDs and keys must be unique.',
      })
    }
    const userIds = new Set(workspace.sampleUsers.map((user) => user.id))
    if (userIds.size !== workspace.sampleUsers.length) {
      context.addIssue({
        code: 'custom',
        path: ['sampleUsers'],
        message: 'Sample user IDs must be unique.',
      })
    }
    const auditIds = new Set(workspace.audit.map((entry) => entry.id))
    if (auditIds.size !== workspace.audit.length) {
      context.addIssue({
        code: 'custom',
        path: ['audit'],
        message: 'Audit entry IDs must be unique.',
      })
    }
    workspace.flags.forEach((flag, flagIndex) => {
      workspace.environmentNames.forEach((environment) => {
        if (!flag.environments[environment]) {
          context.addIssue({
            code: 'custom',
            path: ['flags', flagIndex, 'environments'],
            message: `Missing configuration for ${environment}.`,
          })
        }
      })
      Object.keys(flag.environments).forEach((environment) => {
        if (!environments.has(environment)) {
          context.addIssue({
            code: 'custom',
            path: ['flags', flagIndex, 'environments', environment],
            message: `Unknown environment configuration: ${environment}.`,
          })
        }
        const rules = flag.environments[environment]?.rules ?? []
        const ruleIds = new Set(rules.map((rule) => rule.id))
        if (ruleIds.size !== rules.length) {
          context.addIssue({
            code: 'custom',
            path: ['flags', flagIndex, 'environments', environment, 'rules'],
            message: 'Targeting rule IDs must be unique within an environment.',
          })
        }
      })
    })
  })

export type FeatureFlag = z.infer<typeof flagSchema>
export type FlagWorkspace = z.infer<typeof flagWorkspaceSchema>
export type TargetRule = z.infer<typeof ruleSchema>
export type SampleUser = FlagWorkspace['sampleUsers'][number]

export function evaluateFlag(flag: FeatureFlag, environment: string, user: SampleUser) {
  const config = flag.environments[environment]
  const trace: string[] = []
  if (!config) return { enabled: false, reason: 'Missing environment config', bucket: 0, trace }
  if (!config.enabled) {
    trace.push('Flag is disabled in this environment.')
    return { enabled: false, reason: 'Environment disabled', bucket: 0, trace }
  }
  trace.push('Environment switch is enabled.')
  for (const rule of config.rules) {
    let operation: RulesLogic
    if (rule.operator === 'equals') {
      operation = {
        '==': [
          { var: rule.attribute },
          rule.attribute === 'companySize' ? Number(rule.value) : rule.value,
        ],
      }
    } else if (rule.operator === 'contains') {
      operation = { in: [rule.value, { var: rule.attribute }] }
    } else {
      operation = { '>': [{ var: rule.attribute }, Number(rule.value)] }
    }
    const matched = Boolean(jsonLogic.apply(operation, user))
    trace.push(
      `${rule.attribute} ${rule.operator} ${rule.value}: ${matched ? 'matched' : 'skipped'}.`,
    )
    if (matched)
      return { enabled: rule.serve, reason: `Targeting rule ${rule.id}`, bucket: 0, trace }
  }
  const bucket = (murmurhash(`${flag.key}:${user.id}`) >>> 0) % 100
  const enabled = bucket < config.rollout
  trace.push(`Stable bucket ${bucket} compared with ${config.rollout}% rollout.`)
  return { enabled, reason: 'Percentage rollout', bucket, trace }
}

export function environmentStatus(flag: FeatureFlag, environment: string) {
  const config = flag.environments[environment]
  if (!config?.enabled) return 'Off'
  if (config.rollout === 100) return 'Live'
  return `${config.rollout}%`
}
