import create from 'zustand'
import { produce } from 'immer'
import { devtools } from 'zustand/middleware'
import { SettingsTypes } from '@app-types/settings.types'
import { get as getField } from 'radash'

export interface SettingsState {
  settings: SettingsTypes
}

export interface SettingsMethods {
  getAll: () => Promise<SettingsTypes>
  get: (
    key: string,
    defaultValue: string | number | null | object
  ) => Promise<string | number | null | object>
  set: (key: string, value: string | number | null | object) => Promise<void>
  flush: () => Promise<void>
}

const getInitialState = (): SettingsState => {
  window.api.getAllSettings().then((settings) => {})

  return {
    settings: {
      language: null,
      theme: 'system',
      autoUpdate: false,
    },
  }
}

export interface SettingsStoreState extends SettingsState, SettingsMethods {}

export const useSettingsStore = create<SettingsStoreState>()(
  devtools((set) => ({
    // State
    ...getInitialState(),

    // Methods
    getAll: async () => {
      return window.api.getAllSettings()
    },
    get: async (key: string, defaultValue: string | number | null | object = null) => {
      const settings = await window.api.getAllSettings()

      return getField(settings, key, defaultValue)
    },
    set: async (key: string, value: string | number | null | object) => {
      set(
        produce((state: SettingsState) => {
          state[key] = value
        })
      )
    },
    flush: async () => {
      set(getInitialState())
    },
  }))
)

export const grabLanguage = (state: SettingsStoreState): string => {
  return state.settings.language || 'en'
}
