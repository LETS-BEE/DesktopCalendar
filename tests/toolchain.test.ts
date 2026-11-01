import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

type PackageManifest = {
  packageManager?: string
  engines?: Record<string, string>
  scripts?: Record<string, string>
}

const manifestPath = path.resolve(process.cwd(), 'package.json')

describe('toolchain contract', () => {
  it('pins Node 24 and pnpm', async () => {
    const manifest = JSON.parse(
      await readFile(manifestPath, 'utf8'),
    ) as PackageManifest

    expect(manifest.packageManager).toBe('pnpm@11.9.0')
    expect(manifest.engines).toMatchObject({
      node: '>=24.0.0 <25',
      pnpm: '11.9.0',
    })
  })

  it('keeps compilation and installer packaging separate', async () => {
    const manifest = JSON.parse(
      await readFile(manifestPath, 'utf8'),
    ) as PackageManifest

    expect(manifest.scripts?.build).not.toContain('electron-builder')
    expect(manifest.scripts?.package).toContain('electron-builder')
  })
})
