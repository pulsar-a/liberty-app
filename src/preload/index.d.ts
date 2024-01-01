import { ElectronAPI } from '@electron-toolkit/preload'

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
};


declare global {
  interface Window {
    electron: ElectronAPI
    api: typeof api
  }
}
