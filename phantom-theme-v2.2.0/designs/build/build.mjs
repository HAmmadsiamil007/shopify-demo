/**
 * PHANTOM client-design build pipeline (Task 02 scaffold)
 * -------------------------------------------------------
 * 1. Compile designs/{slug}/production/scss/client.scss with Sass
 *    (Bootstrap modules ONLY, namespaced under .ph-client by the entry file).
 * 2. Purge unused CSS against designs/{slug}/source (all .html/.liquid files, recursive).
 * 3. Minify + write designs/{slug}/production/client-{slug}.css
 *
 * Usage:
 *   node build.mjs --slug phone-premium
 *   node build.mjs --slug phone-premium --check   (fail on >10% size growth)
 *
 * The theme only ever references built files (assets/client-{slug}.css.liquid).
 */
import { compileString } from 'sass'
import { PurgeCSS } from 'purgecss'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DESIGNS_ROOT = path.resolve(__dirname, '..')
const BOOTSTRAP_ENTRY = path.join(__dirname, 'scss', 'client.scss')

const rawArgs = process.argv.slice(2)
const args = {}
for (let i = 0; i < rawArgs.length; i++) {
  const a = rawArgs[i]
  if (a.startsWith('--')) {
    const [k, v] = a.replace(/^--/, '').split('=')
    args[k] = v || rawArgs[i + 1] || true
    if (v === undefined && typeof args[k] === 'string') i++
  } else {
    args[a] = true
  }
}

const slug = String(args.slug || 'template')
const checkOnly = Boolean(args.check)

const designRoot = path.join(DESIGNS_ROOT, slug === 'template' ? '_template' : slug)
const sourceDir = path.join(designRoot, 'source')
const scssDir = path.join(designRoot, 'production', 'scss')
const outFile = path.join(designRoot, 'production', `client-${slug}.css`)

async function ensureDirs() {
  await fs.mkdir(scssDir, { recursive: true })
  await fs.mkdir(path.dirname(outFile), { recursive: true })
}

async function collectHtmlSources() {
  const files = []
  async function walk(dir) {
    let entries
    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) await walk(p)
      else if (/\.(html|liquid)$/.test(e.name)) files.push(p)
    }
  }
  await walk(sourceDir)
  return files
}

async function main() {
  await ensureDirs()

  const scssEntry = await fs
    .readFile(path.join(scssDir, 'client.scss'))
    .catch(() => fs.readFile(BOOTSTRAP_ENTRY))
  const sassResult = compileString(scssEntry.toString('utf8').replaceAll('{slug}', slug), {
    loadPaths: [path.join(__dirname, 'node_modules'), path.join(__dirname, 'scss')],
    style: 'expanded'
  })

  const htmlSources = await collectHtmlSources()
  const purged = await new PurgeCSS().purge({
    content: await Promise.all(
      htmlSources.map(async (f) => ({ raw: (await fs.readFile(f)).toString('utf8'), extension: 'html' }))
    ),
    css: [{ raw: sassResult.css }],
    safelist: {
      standard: [/^ph-client/, /^data-ph-/],
      deep: [/is-visible/, /is-hidden/, /is-active/, /is-open/]
    }
  })

  const css = purged[0].css
  const prev = await fs.readFile(outFile, 'utf8').catch(() => '')
  const growth = prev ? (css.length - prev.length) / prev.length : 0

  if (checkOnly) {
    if (growth > 0.1) {
      console.error(`[client-build] size grew ${(growth * 100).toFixed(1)}% — purge/trim required`)
      process.exit(1)
    }
    console.log(`[client-build] OK ${slug}: ${(css.length / 1024).toFixed(1)} KB (${css.length} bytes)`)
    process.exit(0)
  }

  await fs.writeFile(outFile, css)
  console.log(`[client-build] ${slug} -> ${path.relative(DESIGNS_ROOT, outFile)} (${(css.length / 1024).toFixed(1)} KB)`)
}

main().catch((err) => {
  console.error('[client-build] FAILED:', err.message)
  process.exit(1)
})