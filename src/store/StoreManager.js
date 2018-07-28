const path = require( 'path' )

import { UtilizationStore } from '../utilization/model'

import {
    FSHelper,
    JSONHelper
} from '../common'

const NEW_DATA_FILE = "utilization.xlsx"
const NEW_DATA_FILE_WARINING = "in.xls"

export default class StoreManager {

    static get STORAGE_BASE_PATH_ABS() {
        return path.join( __dirname, "../../data" )
    }

    static path( fileName ) {
        return path.join( StoreManager.STORAGE_BASE_PATH_ABS, fileName )
    }

    static utilizationStorePath() {
        return path.join( StoreManager.STORAGE_BASE_PATH_ABS,
            "utilizationDB.json" )
    }

    static newInputFilePath() {
        return path.join( StoreManager.STORAGE_BASE_PATH_ABS, NEW_DATA_FILE )
    }

    constructor() {

        this._stores = [ {
            "key": UtilizationStore.STORE_KEY,
            "store": new UtilizationStore(),
            "path": "utilizationDB.json",
            "newDataFileName": NEW_DATA_FILE
        } ]

        this.stores.forEach( ( s ) => {
            s.store.initialise(
                require( StoreManager.path( s.path ) ) )
        } )

    }

    get stores() {
        return this._stores
    }

    get keys() {
        return this.stores.map( ( store ) => {
            return store.key
        } )
    }

    getStore( key ) {
        let storeEntry = this.getStoreEntry( key )
        return storeEntry !== null ? storeEntry.store : null
    }

    getStoreEntry( key ) {
        let matchingStores = this.stores.filter( ( store ) => {
            return store.key === key
        } )
        return matchingStores.length === 1 ? matchingStores[ 0 ] : null
    }

    get utilizationStore() {
        return this.getStore( UtilizationStore.STORE_KEY )
    }

    buildAll( names, date ) {
        this.stores.forEach( ( s ) => {
            s.store.build( names, date )
        } )
    }

    hasNewData() {
        let dir = FSHelper.listdirectory( StoreManager.STORAGE_BASE_PATH_ABS )
        let isNewDataFileFound = false

        this.stores.some( ( s ) => {
            if ( dir.includes( s.newDataFileName ) ) {
                isNewDataFileFound = true
            }
        } )

        return isNewDataFileFound
    }

    saveStore( key ) {
        let storeEntry = this.getStoreEntry( key )
        if ( storeEntry !== null ) {
            FSHelper.save( storeEntry.store, storeEntry.path )
        }
    }

    save() {
        for ( let key of this.keys ) {
            this.saveStore( key )
        }
    }
}
