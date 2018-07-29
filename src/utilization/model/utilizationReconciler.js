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

            this.store.store = toList
            this.store.rebuild()

            // clean the store from cicular references
            this.store.reader = null
        }
    }

    isIncluded( record, list ) {
        let filterlist = list.filter( ( r ) => {
            return r.type === record.type && r.name === record.name &&
                r.date.getFullYear() == record.date.getFullYear() &&
                r.date.getMonth() == record.date.getMonth()
        } )

        return filterlist.length > 0
    }
}
