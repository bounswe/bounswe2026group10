import i18n from '@/i18n/i18n'

describe('create.stepLabel i18n interpolation', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('renders "Step N of M" when total is provided (EN)', () => {
    const label = i18n.t('create.stepLabel', { step: 5, total: 5, label: 'Review & Publish' })
    expect(label).toBe('Step 5 of 5: Review & Publish')
  })

  it('interpolates with arbitrary totals — no longer hardcoded to 4', () => {
    const six = i18n.t('create.stepLabel', { step: 3, total: 6, label: 'Anything' })
    expect(six).toBe('Step 3 of 6: Anything')

    const seven = i18n.t('create.stepLabel', { step: 7, total: 7, label: 'Last' })
    expect(seven).toBe('Step 7 of 7: Last')
  })

  it('renders "Adım N / M" in Turkish locale', async () => {
    await i18n.changeLanguage('tr')
    const label = i18n.t('create.stepLabel', { step: 2, total: 5, label: 'Malzemeler' })
    expect(label).toBe('Adım 2 / 5: Malzemeler')
  })
})
