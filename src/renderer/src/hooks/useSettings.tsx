export const useSettings = () => {
  return {
    getAll: () => {
      return window.api.getAllSettings()
    },
    set: (
      key: string,
      value: string | number | null | object = null
    ): string | number | null | object => {
      return value
    },
    get: (key: string, defaultValue: string | number | null | object = null) => {
      console.log('GET', key, defaultValue)
      return window.api.getSetting(key) || defaultValue
    },
    reset: () => {
      console.log('resetSettings')
    },
  }
}
