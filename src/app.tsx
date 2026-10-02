import { useSignal } from '@preact/signals'
import { Activity, History, RefreshCw, ShieldCheck, ToggleRight } from 'lucide-preact'
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { EvaluationPanel } from './components/evaluation-panel'
import { FlagEditor } from './components/flag-editor'
import { FlagList } from './components/flag-list'
import { WorkspaceState } from './components/workspace-state'
import { flagWorkspaceSchema, type FeatureFlag, type FlagWorkspace } from './domain/flags'
import { loadWorkspace, resetWorkspace, saveWorkspace } from './services/flag-store'

const storageKey = 'dev-feature-flags-v1'
const sampleUrl = '/sample-feature-flags.json'

export function App() {
  const noticeTimer = useRef<number | undefined>(undefined)
  const query = useSignal('')
  const [workspace, setWorkspace] = useState<FlagWorkspace | null>(null)
  const [environment, setEnvironment] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list')
  const [mode, setMode] = useState<'flags' | 'audit'>('flags')
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    void loadWorkspace(storageKey, sampleUrl, flagWorkspaceSchema)
      .then((data) => {
        setEnvironment(data.environmentNames[0])
        setWorkspace(data)
        setSelectedId(data.flags[0].id)
        setSelectedUserId(data.sampleUsers[0].id)
      })
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : 'Unexpected workspace error.')
      })
  }, [])
  useEffect(() => () => window.clearTimeout(noticeTimer.current), [])
  const selected = useMemo(
    () => workspace?.flags.find((flag) => flag.id === selectedId) ?? workspace?.flags[0],
    [workspace, selectedId],
  )
  function notify(message: string, error = false) {
    window.clearTimeout(noticeTimer.current)
    setNotice({ text: message, error })
    noticeTimer.current = window.setTimeout(() => setNotice(null), 2200)
  }
  async function updateFlag(change: (flag: FeatureFlag) => FeatureFlag, message: string) {
    if (!workspace || !selected) return false
    try {
      const next = flagWorkspaceSchema.parse({
        ...workspace,
        flags: workspace.flags.map((flag) => (flag.id === selected.id ? change(flag) : flag)),
        audit: [
          {
            id: crypto.randomUUID(),
            at: new Date().toISOString(),
            actor: 'Local operator',
            message,
          },
          ...workspace.audit,
        ].slice(0, 20),
      })
      setWorkspace(next)
      await saveWorkspace(storageKey, next)
      notify('Flag configuration saved locally.')
      return true
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not save the flag workspace.', true)
      return false
    }
  }
  if (!workspace || !selected)
    return <WorkspaceState label="Loading feature flags..." error={loadError} />
  const enabled = workspace.flags.filter((flag) => flag.environments[environment]?.enabled).length

  return (
    <main class="min-h-screen bg-slate-100 text-slate-900">
      <header class="border-b border-slate-800 bg-[#202333] text-white">
        <div class="mx-auto flex min-h-16 max-w-[1800px] items-center gap-3 px-4 sm:px-6">
          <span class="grid size-10 place-items-center bg-indigo-300 text-[#202333]">
            <ToggleRight size={21} />
          </span>
          <div>
            <strong class="block text-sm">Launchline</strong>
            <span class="block text-xs text-indigo-100/70">Feature flag console</span>
          </div>
          <span class="ml-auto hidden text-xs text-slate-300 md:block">
            Deterministic local evaluation
          </span>
          <button
            class="grid size-10 place-items-center border border-white/15 hover:bg-white/5 max-md:ml-auto"
            type="button"
            onClick={() =>
              void resetWorkspace(storageKey, sampleUrl, flagWorkspaceSchema)
                .then((data) => {
                  setEnvironment(data.environmentNames[0])
                  setWorkspace(data)
                  setSelectedId(data.flags[0].id)
                  setSelectedUserId(data.sampleUsers[0].id)
                  setMode('flags')
                  setMobileView('list')
                  query.value = ''
                  notify('Sample flags restored.')
                })
                .catch((error: unknown) =>
                  notify(
                    error instanceof Error ? error.message : 'Could not restore the sample.',
                    true,
                  ),
                )
            }
            aria-label="Restore sample flags"
            title="Restore sample flags"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </header>
      <section class="border-b border-slate-200 bg-white">
        <div class="mx-auto max-w-[1800px] px-4 py-5 sm:px-6">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p class="text-xs font-bold text-indigo-700">RELEASE CONTROL</p>
              <h1 class="mt-1 text-2xl font-bold sm:text-3xl">
                Ship behavior with a visible decision trail
              </h1>
              <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Tune staged rollouts, target known cohorts, and verify exactly why a user receives a
                feature.
              </p>
            </div>
            <div
              class="grid w-full grid-cols-3 border border-slate-300 p-1 sm:flex sm:w-auto"
              aria-label="Environment"
            >
              {workspace.environmentNames.map((name) => (
                <button
                  class={`min-h-9 min-w-0 px-1 text-xs font-bold sm:px-3 ${environment === name ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                  type="button"
                  onClick={() => setEnvironment(name)}
                  aria-pressed={environment === name}
                  key={name}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
          <div class="mt-5 grid grid-cols-3 border border-slate-200 bg-slate-50">
            {[
              {
                Icon: ToggleRight,
                value: `${enabled}/${workspace.flags.length}`,
                label: 'Enabled flags',
              },
              {
                Icon: ShieldCheck,
                value: workspace.flags.reduce(
                  (sum, flag) => sum + flag.environments[environment].rules.length,
                  0,
                ),
                label: 'Targeting rules',
              },
              { Icon: Activity, value: environment, label: 'Environment' },
            ].map(({ Icon, value, label }) => (
              <div
                class="flex min-h-20 min-w-0 items-center gap-3 border-r border-slate-200 px-3 last:border-r-0 sm:px-5"
                key={label}
              >
                <Icon class="hidden text-indigo-700 sm:block" size={18} />
                <span class="min-w-0">
                  <strong class="block truncate text-base sm:text-xl">
                    {label === 'Environment' ? (
                      <>
                        <span class="sm:hidden">{environment.slice(0, 4)}.</span>
                        <span class="hidden sm:inline">{environment}</span>
                      </>
                    ) : (
                      value
                    )}
                  </strong>
                  <span class="text-xs text-slate-500">{label}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <nav class="border-b border-slate-200 bg-white" aria-label="Feature flag views">
        <div class="mx-auto flex max-w-[1800px] px-2 sm:px-5">
          <button
            class={`min-h-12 border-b-2 px-4 text-sm font-bold ${mode === 'flags' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}
            type="button"
            onClick={() => setMode('flags')}
          >
            <ToggleRight class="mr-2 inline" size={16} />
            Flags
          </button>
          <button
            class={`min-h-12 border-b-2 px-4 text-sm font-bold ${mode === 'audit' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}
            type="button"
            onClick={() => setMode('audit')}
          >
            <History class="mr-2 inline" size={16} />
            Audit log
          </button>
        </div>
      </nav>

      {mode === 'audit' ? (
        <div class="mx-auto max-w-[1100px] p-0 sm:p-6">
          <section class="border-y border-slate-200 bg-white sm:border">
            <div class="border-b border-slate-200 p-5">
              <h2 class="font-bold">Configuration activity</h2>
              <p class="mt-1 text-sm text-slate-500">Changes made in this local workspace.</p>
            </div>
            <div>
              {workspace.audit.map((item) => (
                <article
                  class="grid gap-2 border-b border-slate-100 p-4 sm:grid-cols-[160px_140px_1fr] sm:p-5"
                  key={item.id}
                >
                  <time class="text-xs text-slate-500">{new Date(item.at).toLocaleString()}</time>
                  <strong class="text-sm">{item.actor}</strong>
                  <p class="text-sm leading-6 text-slate-600">{item.message}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div class="mx-auto grid max-w-[1800px] items-start gap-4 p-0 sm:p-6 lg:grid-cols-[310px_minmax(0,1fr)] xl:grid-cols-[310px_minmax(0,1fr)_340px]">
          <div class={mobileView === 'list' ? 'block' : 'hidden lg:block'}>
            <FlagList
              flags={workspace.flags}
              environment={environment}
              selectedId={selected.id}
              query={query.value}
              onQuery={(value) => (query.value = value)}
              onSelect={(flag) => {
                setSelectedId(flag.id)
                setMobileView('detail')
              }}
            />
          </div>
          <div class={mobileView === 'detail' ? 'block' : 'hidden lg:block'}>
            <FlagEditor
              flag={selected}
              environment={environment}
              onBack={() => setMobileView('list')}
              onChange={(change, message) => void updateFlag(change, message)}
            />
          </div>
          <div class="hidden xl:block">
            <EvaluationPanel
              flag={selected}
              environment={environment}
              users={workspace.sampleUsers}
              selectedUserId={selectedUserId}
              onUser={setSelectedUserId}
            />
          </div>
          <div
            class={`p-4 sm:p-0 xl:hidden ${mobileView === 'detail' ? 'block' : 'hidden lg:block'} lg:col-start-2`}
          >
            <EvaluationPanel
              flag={selected}
              environment={environment}
              users={workspace.sampleUsers}
              selectedUserId={selectedUserId}
              onUser={setSelectedUserId}
            />
          </div>
        </div>
      )}
      {notice && (
        <div
          class={`fixed right-4 bottom-4 z-50 max-w-sm border bg-white px-4 py-3 text-sm font-bold shadow-xl ${notice.error ? 'border-red-200 text-red-800' : 'border-indigo-200 text-indigo-800'}`}
          role={notice.error ? 'alert' : 'status'}
        >
          {notice.text}
        </div>
      )}
    </main>
  )
}
