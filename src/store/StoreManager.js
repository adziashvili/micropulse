const path = require( 'path' )

import { UtilizationStore } from '../utilization/model'
import { PipelineStore } from '../pipeline/model'
import { ExcelReader } from '../common'

import {
    FSHelper,
    JSONHelper
} from '../common'

const UTILIZATION_NEW_DATA_FILE = "utilization.xlsx"
const PIPELINE_NEW_DATA_FILE = "pipeline.xlsx"

const UTILIZATION_DB = "utilizationDB.json"
const PIPELINE_DB = "pipelineDB.json"

const _STORAGE_ROOT = "../../data"
const _ARCHIVE_FOLDER = "archive"

const DATA_FOLDER = 0
const ARCHIVE_FOLDER = 1

export default class StoreManager {

    static get STORAGE_ROOT_PATH() {
        return path.join( __dirname, _STORAGE_ROOT )
    }

    static get ARCHIVE_FOLDER() {
        return _ARCHIVE_FOLDER
    }

    static path( fileName ) {
        return path.join(
            StoreManager.STORAGE_ROOT_PATH,
            fileName )
    }

    get CURRENT_DATA_FILE() {
        return 1
    }

    get NEW_DATA_FILE() {
        return 2
    }

    get DATA_STORE() {
        return 1
    }

    get ARCHIVE_STORE() {
        return 2
    }

    constructor() {

        this._stores = [ {
                "key": UtilizationStore.STORE_KEY,
                "store": new UtilizationStore(),
                "path": UTILIZATION_DB,
                "newDataFileName": UTILIZATION_NEW_DATA_FILE
        }, {
                "key": PipelineStore.STORE_KEY,
                "store": new PipelineStore(),
                "path": PIPELINE_DB,
                "newDataFileName": PIPELINE_NEW_DATA_FILE
        }
       ]

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

    hasNewData( key ) {
        let dir = FSHelper.listdirectory( StoreManager.STORAGE_ROOT_PATH )
        let storeEntry = this.getStoreEntry( key )

        return dir.includes( storeEntry.newDataFileName )
    }

    readNewData( key ) {

        let storeEntry = this.getStoreEntry( key )

        if ( null === storeEntry ) {
            throw "Error: Invalid key" + key
        }

        if ( !this.hasNewData( key ) ) {
            return Promise.resolve( null )
        } else {
            console.log( '[MP] New data is avaiallbe for %s. Processing...'.yellow, key );
            return ExcelReader.load(
                this.getStoragePath(
                    storeEntry.key,
                    this.NEW_DATA_FILE,
                    this.DATA_STORE ) )
        }
    }

    getStoragePath( key, fileType, storageType ) {

        let store = this.getStoreEntry( key )
        // Getting the store entry

        let file = fileType === this.CURRENT_DATA_FILE ? store.path : store.newDataFileName
        // selecting the file requested based on file type

        let filePath = StoreManager.STORAGE_ROOT_PATH
        // All files reside under root

        if ( storageType === this.ARCHIVE_STORE ) {
            filePath = path.join( filePath, StoreManager.ARCHIVE_FOLDER )
            // incase archive folder needed, adding the path under root
        }

        return path.join( filePath, file )
        // lastly, adding the file name to the selected path
    }

    commit( key ) {
        let store = this.getStoreEntry( key )

        // backup utilization store db
        let dataFile = this.getStoragePath( key, this.CURRENT_DATA_FILE, this.DATA_STORE )
        let dataFileArchive = this.getStoragePath( key, this.CURRENT_DATA_FILE, this.ARCHIVE_STORE )

        FSHelper.rename(
            dataFile,
            FSHelper.touchName( dataFileArchive, "back" ), true )

        // backup input file
        let inputFile = this.getStoragePath( key, this.NEW_DATA_FILE, this.DATA_STORE )
        let inputFileArchive = this.getStoragePath( key, this.NEW_DATA_FILE, this.ARCHIVE_STORE )

        FSHelper.rename(
            inputFile,
            FSHelper.touchName( inputFileArchive, "back" ), true )

        // Save new data
        FSHelper.save( store.store, dataFile )
    }

    saveStore( key ) {
        let storeEntry = this.getStoreEntry( key )
        if ( storeEntry !== null ) {
            FSHelper.save( storeEntry.store, StoreManager.path( storeEntry.path ) )
        }
    }

    save() {
        for ( let key of this.keys ) {
            this.saveStore( key )
        }
    }
}
