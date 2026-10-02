import { del, get, set } from 'idb-keyval'
import type { ZodType } from 'zod'

export async function loadWorkspace<T>(key: string, sample: string, schema: ZodType<T>) {
  const saved = schema.safeParse(await get<unknown>(key))
  if (saved.success) return saved.data
  await del(key)
  const response = await fetch(sample)
  if (!response.ok) throw new Error('Could not load sample flags.')
  return schema.parse(await response.json())
}

export async function saveWorkspace<T>(key: string, value: T) {
  await set(key, value)
  return value
}

export async function resetWorkspace<T>(key: string, sample: string, schema: ZodType<T>) {
  await del(key)
  return loadWorkspace(key, sample, schema)
}
