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
  currentlyReading: {
    type: ['number', 'null'],
    default: null,
  },
  confirmRemoveFromCollection: {
    type: 'boolean',
    default: true,
  },
}

export const settings = new Store({ schema })
// Store.initRenderer()
