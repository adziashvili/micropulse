const readline = require( 'readline' )
const path = require( 'path' )

import { FSHelper } from '../../common'
import { StoreManager } from '../../store'

export default class UtilizationReconciler {

    constructor( store ) {
        this.store = store
        this.reader = this.store.reader
    }

    reconcile() {
        let fromList = this.store.store
        let toList = this.reader.cloneRecords()

        let newRecordsCount = 0
        fromList.forEach( ( fromRecord ) => {
            if ( !this.isIncluded( fromRecord, toList ) ) {
                toList.push( fromRecord )
                console.log( "+ ".green, fromRecord.toString() );
                newRecordsCount++
            }
        } )

        console.log( (
                "+ %d records from currnet will be merged to the new list. Total %d records aft" +
                "er merge." )
            .yellow, newRecordsCount, toList.length )

        if ( newRecordsCount > 0 ) {
            console.log( "! Committing changes".red )
            this.commit( toList )
        }
    }

    commit( records ) {
        // backup utilization store db
        let utilStoreFile = StoreManager.utilizationStorePath()
        FSHelper.rename( utilStoreFile, this.touchName( utilStoreFile,
            "back" ), true )

        // backup input file
        let inputFile = StoreManager.newInputFilePath()
        FSHelper.rename( inputFile, this.touchName( inputFile, "back" ),
            true )

        // Commit new records to store
        this.store.store = records
        this.store.rebuild()

        // clean the store from cicular references
        this.store.reader = null

        // Save new data
        FSHelper.save( this.store, utilStoreFile )
    }

    isIncluded( record, list ) {
        let filterlist = list.filter( ( r ) => {
            return r.type === record.type && r.name === record.name &&
                r.date.getFullYear() == record.date.getFullYear() &&
                r.date.getMonth() == record.date.getMonth()
        } )

        return filterlist.length > 0
    }

    touchName( fileName, prefix ) {
        let d = new Date( Date.now() )
        return fileName +
            `.${ prefix}.D_${ d.getFullYear()}_${ d.getMonth()}_${ d.getDate()}_T_${ d.getHours()}_${ d.getMinutes()}_${ d.getSeconds()}__${ d.getMilliseconds() }`
    }
}
