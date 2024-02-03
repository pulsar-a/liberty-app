import { nativeTheme } from 'electron'

export const changeColorSchemeController = async ({
  input,
}: {
  input: { colorScheme: 'light' | 'dark' }
}): Promise<void> => {
  nativeTheme.themeSource = input.colorScheme || 'light'
}
