import settingsModule from '@/store/modules/settings'

describe('community UI license policy', () => {
  it('keeps source-backed GPL pages enabled without XPACK', () => {
    const state = {
      ...settingsModule.state,
      publicSettings: {},
      themeColors: {},
      hasValidLicense: false
    }

    settingsModule.mutations.SET_PUBLIC_SETTINGS(state, {
      XPACK_ENABLED: false,
      XPACK_LICENSE_IS_VALID: false,
      INTERFACE: { theme_info: {} }
    })

    expect(state.hasValidLicense).toBe(true)
  })
})
