import UtilizationStore from './UtilizationStore'

import { FSHelper, JSONHelper } from '../common'

const STORAGE_BASE_PATH = "./data"
const UTIL_STORE_KEY = "UtilizationStore"

export default class StoreManager {

    constructor() {
        this.registerAll()
        this.initialise()
    }

    registerAll() {
        this._stores = [
            {
                "key": UTIL_STORE_KEY,
                "store": new UtilizationStore(),
                "path": STORAGE_BASE_PATH + "/utilizationDB.json",                
            }
        ]
    }

    get keys() {
        return this.stores.map( ( store ) => {
            return store.key
        } )
    }

    initialise() {
        for ( let key of this.keys ) {
            let storeEntry = this.getStore( key, true )
            storeEntry.store.initialise( require( "../../" + storeEntry.path ) )
        }
    }

    saveStore( key ) {
        let storeEntry = this.getStore( key, true )

        if ( storeEntry !== null ) {
            FSHelper.save( storeEntry.store, storeEntry.path )
        }
    }

    saveAll() {

        for ( let key of this.keys ) {
            this.saveStore( key )
        }
    }

    get utilizationStore() {
        return this.getStore( UTIL_STORE_KEY )
    }

    get stores() {
        return this._stores
    }

    getStore( key, isGetEntry = false ) {

        let match = this.stores.filter( ( store ) => {
            return store.key === key
        } )

        return match.length === 1
            ? isGetEntry
                ? match[ 0 ]
                : match[ 0 ].store
            : null
    }
}
