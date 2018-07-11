import UtilizationRecord from './UtilizationRecord'

export default class UtilizationStore {

    constructor() {
        this.initialise()
    }

    /**
     * Initialises the store.
     *
     * @param {Array} store Records to add to store. If undefined, store is initilised to empty array.
     *
     * @return {void} Nothing
     */
    initialise( store ) {

        if ( !store ) {
            this._store = []
            return
        }

        for ( let record of store._store ) {
            this.addRecord( new UtilizationRecord( record._type, record._name, record._date, record._b, record._i ) )
        }

        console.log( "[SUCCESS] Utilization store initialised (%d records).".green, this._store.length );
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
     * Return a sorted list of record names (distinct)
     *
     * @return {Array} Names in store
     */
    get names() {

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
