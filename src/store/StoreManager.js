const path = require( 'path' )

import UtilizationStore from './UtilizationStore'
import {
    FSHelper,
    JSONHelper
} from '../common'

const STORAGE_BASE_PATH = "./data"
const STORAGE_BASE_PATH_ABS = path.join( __dirname, "../../data" )
const NEW_DATA_FILE = "in.xlsx"
const NEW_DATA_FILE_WARINING = "in.xls"
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
                "path": STORAGE_BASE_PATH + "/utilizationDB.json"
            }
        ]
    }

    static getDataDiretory() {
        return STORAGE_BASE_PATH_ABS
    }

    static path( fileName ) {
        return path.join( STORAGE_BASE_PATH_ABS, fileName )
    }

    static utilizationStorePath() {
        return path.join( STORAGE_BASE_PATH_ABS, "utilizationDB.json" )
    }

    static isNewInputFile() {

        let dir = FSHelper.listdirectory( STORAGE_BASE_PATH_ABS )

        if ( dir.includes( NEW_DATA_FILE_WARINING ) ) {
            console.log(
                "[MP] If you would like process %s, convert it to .xlsx file and try again"
            );
        }

        return dir.includes( NEW_DATA_FILE )
    }

    static newInputFilePath() {
        return path.join( STORAGE_BASE_PATH_ABS, NEW_DATA_FILE )
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

    get names() {
        return this._names
    }

    getStore( key, isGetEntry = false ) {

        let match = this.stores.filter( ( store ) => {
            return store.key === key
        } )

        return match.length === 1 ?
            isGetEntry ?
            match[ 0 ] :
            match[ 0 ].store :
            null
    }
}
