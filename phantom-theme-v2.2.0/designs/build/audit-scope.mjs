/**
 * Selector-scoping audit for client-design production CSS (contract §1).
 * -----------------------------------------------------------------------
 * Guarantee: every emitted selector in client-{slug}.css must reference the
 * scope root class `.ph-client--{slug}` (or `html.js .ph-client--{slug}`
 * for the scroll-reveal guards). A rule that does not contain the scope
 * class can never be constrained to the active design and is a leak.
 *
 * Exceptions handled automatically:
 *   - `@media` / `@supports` wrappers are recursed into (inner rules checked).
 *   - `@keyframes` bodies are skipped (keyframe names are not selectors).
 *   - Other at-rules (`@font-face`, `@charset`, ...) are skipped.
 *
 * Usage: `auditScope(css)` -> string[] of unscoped selector groups.
 */
export function auditScope(css) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const issues = []
  const len = stripped.length

  function scan(i, checkSelectors) {
    while (i < len) {
      const open = stripped.indexOf('{', i)
      const close = stripped.indexOf('}', i)
      if (close === -1) return len
      if (open !== -1 && open < close) {
        const head = stripped.slice(i, open).trim()
        if (!head) return close + 1
        const isAt = head.startsWith('@')
        const isMediaLike = /^@(media|supports)\b/.test(head)
        const isKeyframes = /^@keyframes\b/.test(head)
        if (!isAt && checkSelectors) {
          for (const rawSel of head.split(',')) {
            const sel = rawSel.trim()
            if (sel && !/\.ph-client--demo/.test(sel)) issues.push(sel)
          }
        }
        i = scan(open + 1, isMediaLike ? true : isKeyframes ? false : false)
      } else {
        return close + 1
      }
    }
    return len
  }

  scan(0, true)
  return issues
}

/**
 * Remove dead `.ph-client--demo :root { ... }` rules.
 * Bootstrap's variables module emits `:root { --bs-* }`; nested under the
 * scope wrapper it becomes `.ph-client--demo :root`, which can never match
 * (`:root` is the html element and cannot be a descendant of the scope
 * root). The custom properties it carries are unreferenced. Stripping keeps
 * the shipped asset free of dead global-looking rules.
 */
export function stripDeadRootRules(css) {
  return css.replace(/(^|})\s*\.ph-client--demo :root\s*\{[^}]*\}/g, '$1')
}