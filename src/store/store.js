const Store = require('electron-store');
const schema = {
    colorSchema: {
        type: 'string',
        default: 'system',
    },
    language: {
        type: 'string',
        default: 'en',
    },
};
export const store = new Store({ schema });
// Store.initRenderer()
