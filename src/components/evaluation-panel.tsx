import { CheckCircle2, FlaskConical, XCircle } from 'lucide-preact'
import { evaluateFlag, type FeatureFlag, type SampleUser } from '../domain/flags'

type Props = {
  flag: FeatureFlag
  environment: string
  users: SampleUser[]
  selectedUserId: string
  onUser: (id: string) => void
}

export function EvaluationPanel({ flag, environment, users, selectedUserId, onUser }: Props) {
  const user = users.find((item) => item.id === selectedUserId) ?? users[0]
  const result = evaluateFlag(flag, environment, user)
  const Icon = result.enabled ? CheckCircle2 : XCircle
  return (
    <aside class="border-y border-slate-200 bg-white sm:border">
      <div class="border-b border-slate-200 p-4">
        <div class="flex items-center gap-2">
          <FlaskConical class="text-indigo-700" size={18} />
          <h2 class="font-bold">Evaluation simulator</h2>
        </div>
        <p class="mt-1 text-xs text-slate-500">Explain a flag decision for a sample identity.</p>
      </div>
      <div class="p-4">
        <label>
          <span class="mb-1.5 block text-xs font-bold text-slate-600">Sample identity</span>
          <select
            class="h-11 w-full border border-slate-300 bg-white px-3 text-sm"
            value={user.id}
            onChange={(e) => onUser(e.currentTarget.value)}
          >
            {users.map((item) => (
              <option value={item.id} key={item.id}>
                {item.email}
              </option>
            ))}
          </select>
        </label>
        <dl class="mt-4 grid grid-cols-2 gap-px bg-slate-200 border border-slate-200">
          {[
            ['Country', user.country],
            ['Plan', user.plan],
            ['Company', `${user.companySize} people`],
            ['Stable ID', user.id],
          ].map(([term, value]) => (
            <div class="min-w-0 bg-slate-50 p-3" key={term}>
              <dt class="text-xs font-bold text-slate-400">{term}</dt>
              <dd class="mt-1 truncate text-sm font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        <div
          class={`mt-4 border p-4 ${result.enabled ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}
        >
          <div class="flex items-center gap-2">
            <Icon class={result.enabled ? 'text-emerald-700' : 'text-red-700'} size={20} />
            <strong class={result.enabled ? 'text-emerald-900' : 'text-red-900'}>
              {result.enabled ? 'Enabled' : 'Disabled'}
            </strong>
          </div>
          <p class="mt-2 text-sm text-slate-700">{result.reason}</p>
          {result.reason === 'Percentage rollout' && (
            <p class="mt-1 text-xs text-slate-500">Bucket {result.bucket} of 100</p>
          )}
        </div>
        <h3 class="mt-5 text-xs font-bold text-slate-500">DECISION TRACE</h3>
        <ol class="mt-3 space-y-3">
          {result.trace.map((line, index) => (
            <li
              class="grid grid-cols-[24px_1fr] gap-2 text-sm text-slate-600"
              key={`${line}-${index}`}
            >
              <span class="grid size-6 place-items-center bg-slate-100 text-xs font-black text-slate-500">
                {index + 1}
              </span>
              <span class="pt-0.5 leading-5">{line}</span>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  )
}
