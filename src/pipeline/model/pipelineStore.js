import PipelineRecord from './pipelineRecord'
import PipelineParser from './pipelineParser'

export default class PipelineStore {

    static get STORE_KEY() {
        return "PipelineStore"
    }

    constructor() {
        this.store = []
    }

    initialise( data ) {

        let pipeRecords = []

        if ( data === null || !data ) {
            console.log( "[MP] WARNING: Initialization is not defined".yellow );
        } else if ( !data._store ) {
            console.log( "[MP] WARNING: Initialization data does not include _store records".yellow )
        } else {
            pipeRecords = data._store
        }

        this.store = pipeRecords.map( ( pr ) => {
            return new PipelineRecord( [
                pr._practice,
                pr._closeDate,
                pr._customer,
                pr._opportunity,
                pr._forecast,
                pr._value,
                pr._ir,
                pr._ai,
                pr._duration,
                pr._probablity,
                pr._owner,
                pr._stage,
                pr._pa ] )
        } )

        console.log( "PIPE STORE INTIALISED", this.store.length );
    }

    set store( store ) {
        this._store = store
    }

    get store() {
        return this._store
    }

    get storeKey() {
        return PipelineStore.STORE_KEY
    }

    get size() {
        return this.store.length
    }

    build( names, date ) {
        // here we need to build models
    }

    reconcile( data ) {
        let parser = new PipelineParser( data )
        let newData = parser.parse()

        this.store.forEach( ( p ) => {
            if ( !this.isIncluded( p, newData ) ) {
                newData.push( p )
            } else {
                console.log( "%s %s %s", "+".green, p.practice.grey, p.opportunity.grey );
            }
        } )

        console.log( "%s New opportunities", newData.length - this.store.length );
        console.log( "%s Total opportunities", newData.length );

        this.store = newData
        this.build()
    }

    isIncluded( record, list ) {
        let filterlist = list.filter( ( r ) => {
            return r.customer === record.customer && r.opportunity === record.opportunity
        } )

        return filterlist.length > 0
    }
}
