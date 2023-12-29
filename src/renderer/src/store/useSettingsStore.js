"use strict";
// import create from 'zustand'
// import { produce } from 'immer'
// import { devtools } from 'zustand/middleware'
// import { SettingsTypes } from '@app-types/settings.types'
// import { get as getField } from 'radash'
//
// export interface SettingsState {
//   settings: SettingsTypes
// }
//
// export interface SettingsMethods {
//   getAllSettings: () => Promise<SettingsTypes>
//   setInitialSettings: (settings: SettingsTypes) => void
//   getSettingValue: (
//     key: string,
//     defaultValue: string | number | null | object
//   ) => Promise<string | number | null | object>
//   setSettingValue: (key: string, value: string | number | null | object) => Promise<void>
//   flushSettings: () => Promise<void>
// }
//
// const getInitialState = (): SettingsState => {
//   return {
//     settings: {
//       language: 'en',
//       theme: 'system',
//       autoUpdate: false,
//     },
//   }
// }
//
// export interface SettingsStoreState extends SettingsState, SettingsMethods {}
//
// export const useSettingsStore = create<SettingsStoreState>()(
//   devtools((set) => ({
//     // State
//     ...getInitialState(),
//
//     // Methods
//     getAllSettings: async () => {
//       return window.api.getAllSettings()
//     },
//     // Methods
//     setInitialSettings: async (settings) => {
//       set({ settings })
//     },
//     getSettingValue: async (key: string, defaultValue: string | number | null | object = null) => {
//       const settings = await window.api.getAllSettings()
//       console.log('settings:', settings)
//
//       return getField(settings, key, defaultValue)
//     },
//     setSettingValue: async (key: string, value: string | number | null | object) => {
//       set((state) => {
//         window.api.setAllSettings(state.settings)
//         return state
//       })
//       // window.api.setAllSettings(state.settings)
//       set(
//         produce((state: SettingsState) => {
//           state.settings[key] = value
//         })
//       )
//     },
//     flushSettings: async () => {
//       const initialState = getInitialState()
//       set(initialState)
//       window.api.setAllSettings(initialState.settings)
//     },
//   }))
// )
//
// export const grabLanguage = (state: SettingsStoreState): string => {
//   return state.settings.language || 'en'
// }
