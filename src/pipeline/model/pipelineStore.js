import PipelineRecord from './pipelineRecord'
import PipelineParser from './pipelineParser'

export default class PipelineStore {

    static get STORE_KEY() {
        return "PipelineStore"
    }

    constructor() {
        this.store = []
        this.stages = [
          "Technical Validation",
          "Business Validation",
          "Committed" ]
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

    get names() {
        return this._names
    }

    build( names, date ) {

        if ( !!names ) {
            this._names = names
        }
        if ( !!date ) {
            this._date = date
        }

        if ( this.store.length === 0 ) {
            // nothing to build
            return
        }

        this.setupMonths()
        // Scan and see what is the min and max pipe months

        this.monthly = this.buildMonthlyPipeline()
        // Build the base monthly pipeline data

        this.monthly.forEach( ( p ) => {
            console.log( p.practice );
            p.months.forEach( ( m ) => {
                console.log( m );
            } )
        } )
    }

    buildMonthlyPipeline() {
        let model = []

        // This builds the totals per month
        this.names.forEach( ( name ) => {

            let pipe = { "practice": name, "months": [] }
            model.push( pipe )

            this.months.forEach( ( m ) => {
                let monthlyPipe = { "month": m }
                pipe.months.push( monthlyPipe )
                let total = { value: 0, count: 0 }
                this.stages.forEach( ( s ) => {
                    monthlyPipe[ s ] = this.sumPipe( this.practices( name ), m, s, "_value" )
                    total.value = this.add( total.value, monthlyPipe[ s ].value )
                    total.count += monthlyPipe[ s ].count
                } )
                monthlyPipe[ "Total" ] = total
                monthlyPipe[ "Total" ].avg = this.average( total.value, total.count )
            } )
        } )

        // Building the total per stage per practice
        model.forEach( ( p ) => {

            let practiceTotalPipe = { "month": -1 }
            let pTotals = { value: 0, count: 0, avg: 0 }

            this.stages.forEach( ( s ) => {
                let pStageTotals = { value: 0, count: 0, avg: 0 }
                practiceTotalPipe[ s ] = pStageTotals
                p.months.forEach( ( m ) => {
                    pStageTotals.value = this.add( pStageTotals.value, m[ s ].value )
                    pStageTotals.count += m[ s ].count
                    pTotals.value = this.add( pTotals.value, m[ s ].value )
                    pTotals.count += m[ s ].count
                } )
            } )

            pTotals.avg = this.average( pTotals.value, pTotals.count )
            practiceTotalPipe[ "Total" ] = pTotals
            p.months.push( practiceTotalPipe )
        } )

        return model
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

    setupMonths() {
        this.minDate = this.minCloseDate()
        this.maxDate = this.maxCloseDate()
        this.months = []

        for ( let m = this.minDate.getMonth(); m <= this.maxDate.getMonth(); m++ ) {
            this.months.push( m )
        }
    }

    maxCloseDate() {
        let maxDate = null

        if ( this.store.length > 0 ) {
            maxDate = this.store[ 0 ].closeDate
        } else {
            return maxDate
        }

        this.store.forEach( ( p ) => {
            if ( p.closeDate.valueOf() > maxDate.valueOf() ) {
                maxDate = p.closeDate
            }
        } )

        return maxDate
    }

    minCloseDate() {
        let minDate = null

        if ( this.store.length > 0 ) {
            minDate = this.store[ 0 ].closeDate
        } else {
            return minDate
        }

        this.store.forEach( ( p ) => {
            if ( p.closeDate.valueOf() < minDate.valueOf() ) {
                minDate = p.closeDate
            }
        } )

        return minDate
    }

    practices( name ) {

        let APAC = [ "ANZ", "ASEAN", "INDIA", "S.KOREA" ]

        switch ( name ) {
            case "APAC":
                return APAC
                break;
            case "APJ":
                return APAC.concat( [ "JAPAN", "APJ Shared" ] )
                break;
            default:
                return [ name ]
        }
    }

    average( sum, count ) {
        return count !== 0 ? this.fixed( sum / count ) : 0
    }

    add( a, b ) {
        return this.fixed( a + b )
    }

    fixed( num ) {
        return num.toFixed( 2 ) * 1
    }

    sumPipe( practices, month, stage, propery ) {

        let pipe = this.store.filter( ( p ) => {
            return practices.includes( p.practice ) &&
                p.closeDate.getMonth() === month &&
                p.stage === stage
        } )

        let value = this.sum( pipe, propery )
        let count = pipe.length
        let avg = this.average( value, count )

        return { value, count, avg }
    }

    sum( list, property ) {
        let sum = 0
        list.forEach( ( item ) => {
            sum += item[ property ]
        } )
        return sum.toFixed( 2 ) * 1
    }
}
