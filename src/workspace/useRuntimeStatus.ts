import { useSyncExternalStore } from 'react'
import { python, type RuntimeStatus } from '../runtime/runner'

const subscribe = (l: () => void) => python.subscribe(l)
const read = () => python.status

export function useRuntimeStatus(): RuntimeStatus {
  return useSyncExternalStore(subscribe, read, read)
}
