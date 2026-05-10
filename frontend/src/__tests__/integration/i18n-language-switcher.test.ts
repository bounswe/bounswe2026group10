import i18n from '@/i18n/i18n'
import { LANGUAGE_STORAGE_KEY } from '@/lib/language-storage'

describe('i18n language switcher', () => {
  let reloadSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    reloadSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: reloadSpy },
    })
    localStorage.removeItem(LANGUAGE_STORAGE_KEY)
    // reset to english before each test
    void i18n.changeLanguage('en')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('persists the new language to localStorage on change', async () => {
    await i18n.changeLanguage('tr')
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('tr')
  })

  it('calls window.location.reload when language actually changes', async () => {
    await i18n.changeLanguage('en')   // start at en (no reload — same lang)
    reloadSpy.mockClear()

    await i18n.changeLanguage('tr')
    expect(reloadSpy).toHaveBeenCalledTimes(1)
  })

  it('does NOT reload when the same language is set again', async () => {
    await i18n.changeLanguage('en')
    reloadSpy.mockClear()

    await i18n.changeLanguage('en')
    expect(reloadSpy).not.toHaveBeenCalled()
  })

  it('updates document.documentElement.lang on change', async () => {
    await i18n.changeLanguage('tr')
    expect(document.documentElement.lang).toBe('tr')

    await i18n.changeLanguage('en')
    expect(document.documentElement.lang).toBe('en')
  })
})
