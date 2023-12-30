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
}

export const store = new Store({ schema })
// Store.initRenderer()
