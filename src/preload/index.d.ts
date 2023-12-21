import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      desktop: boolean;
      test: (medd: string) => void;
      setTitle: (title: string) => void;
      openFile: () => Promise<string | null>;
      onUpdateCounter: (callback: (value: number) => void) => void;
      counterValue: (value: number) => void;
    },
  }
}
