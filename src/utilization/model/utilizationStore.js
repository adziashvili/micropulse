const assert = require( 'assert' )

import { JSONHelper } from '../../common'

import UtilizationRecord from './UtilizationRecord'
import UtilizationReader from './UtilizationReader'

export default class UtilizationStore {

    static STORE_KEY() {
        return "UtilizationStore"
    }

    constructor() {
        this._store = []
        this._types = [ "Billable", "Investment", "Total" ]
        this._monthly = []
        this._ytd = []
        this._top = []
        this._bottom = []
        this._names = []
        this.date = null
    }

    /**
     * Initialises the store.
     *
     * @param {Array} store Records to add to store. If undefined, store is initilised to empty array.
     *
     * @return {void} Nothing
     */
    initialise( store ) {

        let theStore = !!store._store ? store._store : store.store._store

        let records = theStore.map( ( record ) => {
            return new UtilizationRecord( record._type, record._name,
                record._date, record._b, record._i )
        } )

        this.store = records
    }

    /**
     * Builds all models based on records in store.
     *
     * @param {Array} names [description]
     * @param {Date} date  [description]
     *
     * @return {[type]} [description]
     */
    build( names, date ) {

        if ( !!names ) {
            this._names = names
        }
        if ( !!date ) {
            this._date = date
        }

        this.monthly = this.buildModel( UtilizationRecord.TYPE_MONTHLY )
        this.ytd = this.buildModel( UtilizationRecord.TYPE_YTD )
        this.buildTop()
    }

    buildModel( uType ) {

        let model = []

        this.names.forEach( ( name ) => {
            this.types.forEach( ( type ) => {
                if ( !model[ name ] ) {
                    model[ name ] = {}
                }
                model[ name ][ type ] = []

                for ( let m = 0; m < this.date.getMonth(); m++ ) {
                    let records = this.getLatest( uType,
                        name, this.date.getFullYear(),
                        m )

                    assert( records.length <= 1 )

                    let utilization =
                        records.length === 0 ? 0 :
                        type === "Billable" ?
                        records[ 0 ].billable :
                        type === "Investment" ?
                        records[ 0 ].investment :
                        records[ 0 ].total

                    model[ name ][ type ][ m ] = Math.round(
                        utilization * 1000 ) / 1000
                }
            } )

            model[ name ][ "MoM" ] = [ 1 ]

            let changes = model[ name ][ "MoM" ]
            let values = model[ name ].Total

            for ( let i = 1; i < values.length; i++ ) {
                let change = values[ i ] / (
                    values[ i - 1 ] === 0 ?
                    1 :
                    values[ i - 1 ]
                )
                changes.push( values[ i ] / values[ i - 1 ] )
            }
        } )

        return model
    }

    buildTop() {

        this.bottom = []
        this.top = []

        let topOrBottomSize = 10
        let tmp = JSONHelper.deepClone( this.store )

        tmp.sort( ( a, b ) => {
            let at = a._b + a._i
            let bt = b._b + b._i
            return bt - at
        } )
        // sort by total

        let nonPracticeNames = [ "APJ", "APAC", "APJ Shared" ]
        tmp = tmp.filter( ( item ) => {
            return !nonPracticeNames.includes( item._name )
        } )
        // remove the aggregation entries

        for ( let i = 0; i < topOrBottomSize; i++ ) {
            this.top.push( {
                name: tmp[ i ]._name,
                total: ( tmp[ i ]._i + tmp[ i ]._b )
                    .toFixed( 3 ) *
                    1,
                date: tmp[ i ]._date,
                type: tmp[ i ]._type
            } )
        }
        // take top 10

        for ( let i = tmp.length; i-- > tmp.length - topOrBottomSize; ) {
            this.bottom.push( {

                name: tmp[ i ]._name,
                total: ( tmp[ i ]._i + tmp[ i ]._b )
                    .toFixed( 3 ) *
                    1,
                date: tmp[ i ]._date,
                type: tmp[ i ]._type
            } )
        }
        // take bottom 10
    }

    reconcile( data ) {
        let reader = new UtilizationReader()
        reader.loadRecords( data )
        let toList = reader.cloneRecords()

        let newRecordsCount = 0
        this.store.forEach( ( fromRecord ) => {
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
            this.store = toList
            // Storing reconciled list

            this.build()
            // Building the models
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

    /**
     * Return a sorted list of record names (distinct) as listed in the data.
     *
     * @return {Array} Names in store
     */
    listNames() {

        let names = []

        this.store.forEach( ( record ) => {
            if ( !names.includes( record.name ) ) {
                names.push( record.name )
            }
        } )

        return names.sort()
    }

    /**
     * Adds a record to the utilization store.
     *
     * @param {UtilizationRecord} record UtilizationRecord to add
     */
    addRecord( record ) {
        this.store.push( record )
    }

    /**
     * [getRecords description]
     *
     * @param {[type]} type [description]
     * @param {[type]} name [description]
     *
     * @return {[type]} [description]
     */
    getRecords( type, name ) {
        return this.store.filter( ( r ) => {
            return r.type === type && r.name === name
        } )
    }

    /**
     * [getLatest description]
     *
     * @param {[type]} type  [description]
     * @param {[type]} name  [description]
     * @param {[type]} year  [description]
     * @param {[type]} month [description]
     *
     * @return {[type]} [description]
     */
    getLatest( type, name, year, month ) {

        let monthDate = new Date( year, month )

        let records = this.getRecords( type, name )
        // get the records for type and name

        records = records.filter( ( r ) => {
            return r.date.getFullYear() == monthDate.getFullYear() &&
                r.date.getMonth() == monthDate.getMonth()
        } )
        // filter the reocrds for the relevant month

        if ( records.length > 0 ) {

            let latestDate = records[ 0 ].date
            // What's the latest date

            for ( let r of records ) {
                if ( r.date > latestDate ) {
                    latestDate = r.date
                }
            }
            // find the record with the latest date

            records = records.filter( ( r ) => {
                return r.date >= latestDate
            } )
        }

        return records
    }

    get storeKey() {
        return UtilizationStore.STORE_KEY
    }

    /**
     * Returns a reference to the utilization store.
     *
     * @return {Array} Array of records consistuting the store.
     */
    get store() {
        return this._store
    }

    set store( records ) {
        this._store = records
    }

    set bottom( bottom ) {
        this._bottom = bottom
    }

    get bottom() {
        return this._bottom
    }

    set top( top ) {
        this._top = top
    }

    get top() {
        return this._top
    }

    get monthly() {
        return this._monthly
    }

    set monthly( model ) {
        this._monthly = model
    }

    get types() {
        return this._types
    }

    get names() {
        return this._names
    }

    set date( d ) {
        this._date = null
    }

    get date() {
        return this._date
    }

    get ytd() {
        return this._ytd
    }

    set ytd( model ) {
        this._ytd = model
    }

    get size() {
        return this._store.length
    }

}
