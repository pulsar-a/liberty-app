import { booksMock } from '#/mocks/books'
import { ipcMain } from 'electron'

export const initDataListeners = () => {
  ipcMain.handle('data:books', async () => {
    return await new Promise((resolve) => {
      setTimeout(() => {
        resolve(booksMock)
      }, 2000)
    })
  })
}
