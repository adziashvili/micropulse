import UtilizationRecord from './UtilizationRecord'

export default class UtilizationStore {

    constructor() {
        this.initialise()
    }

    initialise( store ) {

        if ( !store ) {
            this._store = []
            return
        }

        for ( let record of store._store ) {            
            this.addRecord( new UtilizationRecord( record._type, record._name, record._date, record._b, record._i ) )
        }
    }

    get store() {
        return this._store
    }

    addRecord( record ) {
        this.store.push( record )
    }

    getRecords( type, name ) {

        let tmp = this.store.filter( ( r ) => {
            return r.type === type
        } )

        tmp = tmp.filter( ( r ) => {
            return r.name === name
        } )

        return tmp
    }

    getLatest( type, name, year, month ) {

        // Which month are looking for?
        let strMonth = month < 10
            ? "0" + month
            : "" + month

        let strDate = year + "-" + strMonth + "-01T00:00:00"

        let monthDate = new Date( strDate )

        console.log( strDate );

        // get the records for type and name
        let records = this.getRecords( type, name )

        // filter the reocrds that are above the threshhold
        records = records.filter( ( r ) => {
            return r.date.getYear() == monthDate.getYear() && r.date.getMonth() == monthDate.getMonth()
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
