import { Search, ToggleLeft } from 'lucide-preact'
import { environmentStatus, type FeatureFlag } from '../domain/flags'

type Props = {
  flags: FeatureFlag[]
  environment: string
  selectedId: string
  query: string
  onQuery: (value: string) => void
  onSelect: (flag: FeatureFlag) => void
}

export function FlagList({ flags, environment, selectedId, query, onQuery, onSelect }: Props) {
  const filtered = flags.filter((flag) =>
    `${flag.name} ${flag.key} ${flag.owner}`.toLowerCase().includes(query.toLowerCase()),
  )
  return (
    <aside class="border-y border-slate-200 bg-white sm:border">
      <div class="border-b border-slate-200 p-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-bold">Feature flags</h2>
            <p class="mt-1 text-xs text-slate-500">{filtered.length} controls</p>
          </div>
          <ToggleLeft class="text-indigo-700" size={21} />
        </div>
        <label class="relative mt-4 block">
          <span class="sr-only">Search feature flags</span>
          <Search class="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={16} />
          <input
            class="h-10 w-full border border-slate-300 bg-slate-50 pr-3 pl-9 text-sm"
            value={query}
            onInput={(e) => onQuery(e.currentTarget.value)}
            placeholder="Search key, owner, or name"
          />
        </label>
      </div>
      <div class="max-h-[calc(100vh-340px)] min-h-72 overflow-y-auto">
        {filtered.map((flag) => {
          const status = environmentStatus(flag, environment)
          return (
            <button
              class={`block w-full border-b border-slate-100 p-4 text-left hover:bg-slate-50 ${selectedId === flag.id ? 'border-l-4 border-l-indigo-600 bg-indigo-50/60 pl-3' : ''}`}
              type="button"
              onClick={() => onSelect(flag)}
              key={flag.id}
            >
              <span class="flex items-center gap-2">
                <span
                  class={`size-2 rounded-full ${status === 'Off' ? 'bg-slate-300' : 'bg-emerald-500'}`}
                />
                <strong class="min-w-0 truncate text-sm">{flag.name}</strong>
                <span
                  class={`ml-auto text-xs font-black ${status === 'Off' ? 'text-slate-400' : 'text-indigo-700'}`}
                >
                  {status}
                </span>
              </span>
              <span class="mt-1 block truncate font-mono text-xs text-slate-500">{flag.key}</span>
              <span class="mt-2 block text-xs text-slate-500">{flag.owner}</span>
            </button>
          )
        })}
        {!filtered.length && (
          <p class="p-8 text-center text-sm text-slate-500">No flags match this search.</p>
        )}
      </div>
    </aside>
  )
}
