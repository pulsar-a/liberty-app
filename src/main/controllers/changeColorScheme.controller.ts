import { nativeTheme } from 'electron'

export const changeColorSchemeController = () => {
  return async ({ input }: { input: { colorScheme: 'light' | 'dark' } }): Promise<void> => {
    nativeTheme.themeSource = input.colorScheme || 'light'
  }
}
