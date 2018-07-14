const assert = require( 'assert' )
import UtilizationRecord from './UtilizationRecord'
import { JSONHelper } from '../common'

export default class UtilizationStore {

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

        for ( let record of store._store ) {
            this.addRecord( new UtilizationRecord( record._type, record._name, record._date, record._b, record._i ) )
        }

        console.log( "[MICROPULSE] Utilization store loaded %d records.".green, this._store.length );
    }

    build( names, date ) {

        this._names = names
        this._date = date

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
                    let records = this.getLatest( uType, name, this.date.getFullYear(), m )
                    assert( records.length <= 1 )

                    let utilization = records.length === 0
                        ? 0
                        : type === "Billable"
                            ? records[ 0 ].billable
                            : type === "Investment"
                                ? records[ 0 ].investment
                                : records[ 0 ].total

                    model[ name ][ type ][ m ] = Math.round( utilization * 1000 ) / 1000
                }
            } )

            model[ name ][ "MoM" ] = [ 1 ]

            let changes = model[ name ][ "MoM" ]
            let values = model[ name ].Total

            for ( let i = 1; i < values.length; i++ ) {
                let change = values[ i ] / (
                    values[i - 1] === 0
                        ? 1
                        : values[i - 1]
                )
                changes.push( values[ i ] / values[i - 1] )
            }
        } )

        return model
    }

    buildTop() {

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
        // remove the  aggregation entries

        for ( let i = 0; i < topOrBottomSize; i++ ) {
            this.top.push( {
                name: tmp[ i ]._name,
                total: ( tmp[ i ]._i + tmp[ i ]._b ).toFixed( 3 ) * 1,
                date: tmp[ i ]._date,
                type: tmp[ i ]._type
            } )
        }
        // take top 10

        for (let i = tmp.length; i-- > tmp.length - topOrBottomSize;) {
            this.bottom.push( {

                name: tmp[ i ]._name,
                total: ( tmp[ i ]._i + tmp[ i ]._b ).toFixed( 3 ) * 1,
                date: tmp[ i ]._date,
                type: tmp[ i ]._type
            } )
        }
        // take bottom 10
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

    /**
     * Returns a reference to the utilization store.
     *
     * @return {Array} Array of records consistuting the store.
     */
    get store() {
        return this._store
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

        // get the records for type and name
        let records = this.getRecords( type, name )

        // filter the reocrds for the relevant month
        records = records.filter( ( r ) => {
            return r.date.getFullYear() == monthDate.getFullYear() && r.date.getMonth() == monthDate.getMonth()
        } )

        if ( records.length > 0 ) {
            // What's the latest date
            let latestDate = records[ 0 ].date
            for ( let r of records ) {
                if ( r.date > latestDate ) {
                    latestDate = r.date
                }
            }

            records = records.filter( ( r ) => {
                return r.date >= latestDate
            } )
        }

        return records
    }

}
