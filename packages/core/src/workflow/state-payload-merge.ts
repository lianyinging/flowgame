/** payload 深合并：同 key 直接覆盖；嵌套对象递归合并 */
export function deepMergePayload(
  base: unknown,
  patch: unknown
): Record<string, unknown> {
  if (patch === null || patch === undefined)
    return (base && typeof base === 'object' && !Array.isArray(base))
      ? { ...(base as Record<string, unknown>) }
      : {}

  if (typeof patch !== 'object' || Array.isArray(patch))
    return {}

  const baseObj =
    base && typeof base === 'object' && !Array.isArray(base)
      ? { ...(base as Record<string, unknown>) }
      : {}

  const result: Record<string, unknown> = { ...baseObj }
  for (const [key, val] of Object.entries(patch as Record<string, unknown>)) {
    const prev = result[key]
    if (
      prev !== null
      && typeof prev === 'object'
      && !Array.isArray(prev)
      && val !== null
      && typeof val === 'object'
      && !Array.isArray(val)
    ) {
      result[key] = deepMergePayload(prev, val)
    }
    else {
      result[key] = val
    }
  }
  return result
}
