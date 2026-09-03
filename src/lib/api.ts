import type { WorkspaceData } from './types'

const BASE = '/api'

async function req<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`${method} ${path} → ${res.status} ${detail}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  getState: () => req<WorkspaceData>('/state', 'GET'),
  replaceState: (data: WorkspaceData) => req<WorkspaceData>('/state', 'PUT', data),
  reset: () => req<WorkspaceData>('/reset', 'POST'),

  create: (resource: string, item: object) =>
    req<{ ok: boolean }>(`/${resource}`, 'POST', item),
  patch: (resource: string, id: string, patch: object) =>
    req<{ ok: boolean }>(`/${resource}/${id}`, 'PATCH', patch),
  remove: (resource: string, id: string) =>
    req<{ ok: boolean }>(`/${resource}/${id}`, 'DELETE'),
}
