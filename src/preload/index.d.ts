import { ElectronAPI } from '@electron-toolkit/preload'
import { ipcRenderer } from 'electron'
import { LoadingStatusItem } from '../../types/loader.types'

export declare const api: {
    settings: {
        get(key: any, defaultValue: any): any;
        getAll(): any;
        set(property: any, val: any): void;
        reset(): void;
    };
    setTitle: (title: string) => void;
    openFile: () => Promise<string|null>;
    selectFolder: () => Promise<string|null>;
    onUpdateCounter: (callback: any) => Electron.IpcRenderer;
    counterValue: (value: any) => void;
    onAddLoaders: (callback: (items: LoadingStatusItem[]) => void) => void,
    onUpdateLoader: (
      callback: (value: {
        id: string | number
        status: LoadingStatusItem['status']
        label?: string
        labelParams?: Record<string, string>
        subLabel?: string
        subLabelParams?: Record<string, string>
      }) => void
    ) => void,
};


declare global {
  interface Window {
    electron: ElectronAPI
    api: typeof api
  }
}
