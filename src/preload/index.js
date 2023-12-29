import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
// Custom APIs for renderer
const api = {
    desktop: true,
};
// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI);
        contextBridge.exposeInMainWorld('api', {
            settings: {
                get(key, defaultValue) {
                    return ipcRenderer.sendSync('settings:get', key, defaultValue);
                },
                getAll() {
                    return ipcRenderer.sendSync('settings:getAll');
                },
                set(property, val) {
                    ipcRenderer.send('settings:set', property, val);
                },
                reset() {
                    ipcRenderer.send('settings:reset');
                },
                // Other method you want to add like has(), reset(), etc.
            },
            // IPC: Renderer -> main
            setTitle: (title) => ipcRenderer.send('window:set-title', title),
            // IPC: Renderer -> main + data return
            openFile: () => ipcRenderer.invoke('dialog:open-file'),
            // IPC: main -> Renderer
            onUpdateCounter: (callback) => ipcRenderer.on('update-counter', (_event, value) => callback(value)),
            // IPC: Renderer -> main
            counterValue: (value) => ipcRenderer.send('counter-value', value),
        });
    }
    catch (error) {
        console.error(error);
    }
}
else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI;
    // @ts-ignore (define in dts)
    window.api = api;
}
