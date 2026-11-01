import { describe, expect, it } from 'vitest'

import { parseExternalWebUrl } from '../electron/windows/navigation'

describe('window navigation', () => {
  it('allows HTTP and HTTPS links to open in the system browser', () => {
    expect(parseExternalWebUrl('https://example.com/docs'))
      .toBe('https://example.com/docs')
    expect(parseExternalWebUrl('http://example.com/'))
      .toBe('http://example.com/')
  })

  it('rejects local, executable, and credential-bearing URLs', () => {
    expect(parseExternalWebUrl('file:///C:/Windows/System32/calc.exe')).toBeNull()
    expect(parseExternalWebUrl('javascript:alert(1)')).toBeNull()
    expect(parseExternalWebUrl('https://user:password@example.com/')).toBeNull()
    expect(parseExternalWebUrl('not a URL')).toBeNull()
  })
})
