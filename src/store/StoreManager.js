import UtilizationStore from './UtilizationStore'

export default class StoreManager {

    constructor() {
        this._us = new UtilizationStore()
    }

    get utilizationStore() {
        return this._us
    }
}
