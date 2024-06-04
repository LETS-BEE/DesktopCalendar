import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'

import modules from './modules'

export default new Vuex.Store({
    modules,
    strict: process.env.NODE_ENV !== 'production',
    plugins: [createPersistedState()]
})