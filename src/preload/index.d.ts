import { ElectronAPI } from '@electron-toolkit/preload'
import { SettingsTypes } from '../../types/settings.types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      desktop: boolean;
      test: (medd: string) => void;
      setTitle: (title: string) => void;
      getAllSettings: () => Promise<SettingsTypes>;
      setAllSettings: (settings: SettingsTypes) => Promise<SettingsTypes>;
      openFile: () => Promise<string | null>;
      onUpdateCounter: (callback: (value: number) => void) => void;
      counterValue: (value: number) => void;
    },
  }
}
