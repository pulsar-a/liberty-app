const Store = require('electron-store')

const schema = {
  theme: {
    type: 'string',
    default: 'system',
  },
  language: {
    type: 'string',
    default: 'en',
  },
  userFilesDir: {
    type: 'string',
    default: '',
  },
}

export const settings = new Store({ schema })
// Store.initRenderer()
