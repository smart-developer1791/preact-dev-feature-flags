import { ArrowLeft, Plus, SlidersHorizontal, Trash2 } from 'lucide-preact'
import { nanoid } from 'nanoid'
import type { FeatureFlag, TargetRule } from '../domain/flags'

type Props = {
  flag: FeatureFlag
  environment: string
  onBack: () => void
  onChange: (change: (flag: FeatureFlag) => FeatureFlag, message: string) => void
}

export function FlagEditor({ flag, environment, onBack, onChange }: Props) {
  const config = flag.environments[environment]
  function updateConfig(change: (current: typeof config) => typeof config, message: string) {
    onChange(
      (current) => ({
        ...current,
        updatedAt: new Date().toISOString(),
        environments: {
          ...current.environments,
          [environment]: change(current.environments[environment]),
        },
      }),
      message,
    )
  }
  function updateRule(id: string, change: Partial<TargetRule>) {
    updateConfig(
      (current) => ({
        ...current,
        rules: current.rules.map((rule) => (rule.id === id ? { ...rule, ...change } : rule)),
      }),
      `Updated a targeting rule in ${environment}.`,
    )
  }

  return (
    <article class="border-y border-slate-200 bg-white sm:border">
      <header class="border-b border-slate-200 p-4 sm:p-5">
        <div class="flex items-start gap-3">
          <button
            class="grid size-10 shrink-0 place-items-center border border-slate-300 lg:hidden"
            type="button"
            onClick={onBack}
            aria-label="Back to feature flags"
          >
            <ArrowLeft size={18} />
          </button>
          <div class="min-w-0">
            <p class="truncate font-mono text-xs font-bold text-indigo-700">{flag.key}</p>
            <h2 class="mt-1 text-xl font-bold">{flag.name}</h2>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{flag.description}</p>
          </div>
        </div>
        <div class="mt-4 flex flex-wrap items-center gap-3 border border-slate-200 bg-slate-50 p-3">
          <span class="text-xs font-bold text-slate-500">{environment.toUpperCase()}</span>
          <label class="ml-auto inline-flex cursor-pointer items-center gap-3">
            <span class="text-sm font-bold">{config.enabled ? 'Enabled' : 'Disabled'}</span>
            <input
              class="peer sr-only"
              type="checkbox"
              checked={config.enabled}
              onChange={(e) =>
                updateConfig(
                  (current) => ({ ...current, enabled: e.currentTarget.checked }),
                  `${e.currentTarget.checked ? 'Enabled' : 'Disabled'} ${flag.key} in ${environment}.`,
                )
              }
            />
            <span
              class={[
                'relative h-7 w-12 bg-slate-300 transition-colors',
                'peer-checked:bg-indigo-600 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500',
                'after:absolute after:top-1 after:left-1 after:size-5 after:bg-white',
                'after:transition-transform peer-checked:after:translate-x-5',
              ].join(' ')}
            />
          </label>
        </div>
      </header>

      <section class="border-b border-slate-200 p-4 sm:p-5">
        <div class="flex items-start gap-3">
          <SlidersHorizontal class="mt-0.5 text-indigo-700" size={19} />
          <div>
            <h3 class="font-bold">Percentage rollout</h3>
            <p class="mt-1 text-xs text-slate-500">
              Users are assigned to a stable bucket from their ID and flag key.
            </p>
          </div>
          <strong class="ml-auto text-lg text-indigo-700">{config.rollout}%</strong>
        </div>
        <input
          class="mt-4 h-8 w-full accent-indigo-600"
          type="range"
          min="0"
          max="100"
          step="5"
          value={config.rollout}
          onChange={(e) =>
            updateConfig(
              (current) => ({ ...current, rollout: Number(e.currentTarget.value) }),
              `Set ${flag.key} rollout to ${e.currentTarget.value}% in ${environment}.`,
            )
          }
          aria-label="Percentage rollout"
        />
        <div class="flex justify-between text-xs font-semibold text-slate-400">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </section>

      <section class="p-4 sm:p-5">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h3 class="font-bold">Targeting rules</h3>
            <p class="mt-1 text-xs text-slate-500">
              First matching rule wins before percentage rollout.
            </p>
          </div>
          <button
            class="inline-flex h-9 items-center gap-2 border border-slate-300 px-3 text-xs font-bold hover:bg-slate-50"
            type="button"
            onClick={() =>
              updateConfig(
                (current) => ({
                  ...current,
                  rules: [
                    ...current.rules,
                    {
                      id: nanoid(8),
                      attribute: 'plan',
                      operator: 'equals',
                      value: 'enterprise',
                      serve: true,
                    },
                  ],
                }),
                `Added a targeting rule in ${environment}.`,
              )
            }
          >
            <Plus size={15} /> Add rule
          </button>
        </div>
        <div class="mt-4 space-y-3">
          {config.rules.map((rule, index) => (
            <div class="border border-slate-200 p-3" key={rule.id}>
              <div class="mb-3 flex items-center justify-between">
                <strong class="text-xs text-slate-500">RULE {index + 1}</strong>
                <button
                  class="grid size-8 place-items-center text-slate-400 hover:bg-red-50 hover:text-red-600"
                  type="button"
                  onClick={() =>
                    updateConfig(
                      (current) => ({
                        ...current,
                        rules: current.rules.filter((item) => item.id !== rule.id),
                      }),
                      `Removed a targeting rule in ${environment}.`,
                    )
                  }
                  aria-label={`Remove rule ${index + 1}`}
                  title="Remove rule"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div class="grid gap-2 md:grid-cols-[1fr_1fr_1.2fr_.8fr]">
                <label>
                  <span class="mb-1 block text-xs font-bold text-slate-500">Attribute</span>
                  <select
                    class="h-10 w-full border border-slate-300 bg-white px-2 text-sm"
                    value={rule.attribute}
                    onChange={(e) =>
                      updateRule(rule.id, {
                        attribute: e.currentTarget.value as TargetRule['attribute'],
                      })
                    }
                  >
                    {['country', 'plan', 'email', 'companySize'].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span class="mb-1 block text-xs font-bold text-slate-500">Operator</span>
                  <select
                    class="h-10 w-full border border-slate-300 bg-white px-2 text-sm"
                    value={rule.operator}
                    onChange={(e) =>
                      updateRule(rule.id, {
                        operator: e.currentTarget.value as TargetRule['operator'],
                      })
                    }
                  >
                    {['equals', 'contains', 'greaterThan'].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span class="mb-1 block text-xs font-bold text-slate-500">Value</span>
                  <input
                    class="h-10 w-full border border-slate-300 px-3 text-sm"
                    value={rule.value}
                    onInput={(e) => updateRule(rule.id, { value: e.currentTarget.value })}
                  />
                </label>
                <label>
                  <span class="mb-1 block text-xs font-bold text-slate-500">Serve</span>
                  <select
                    class="h-10 w-full border border-slate-300 bg-white px-2 text-sm"
                    value={String(rule.serve)}
                    onChange={(e) =>
                      updateRule(rule.id, { serve: e.currentTarget.value === 'true' })
                    }
                  >
                    <option value="true">On</option>
                    <option value="false">Off</option>
                  </select>
                </label>
              </div>
            </div>
          ))}
          {!config.rules.length && (
            <p class="border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
              No targeting rules. Percentage rollout applies to everyone.
            </p>
          )}
        </div>
      </section>
    </article>
  )
}
