import PipelineRecord from './pipelineRecord'
import PipelineParser from './pipelineParser'

import { DateHelper } from '../../common'
import { PracticeManager } from '../../managers'

export default class PipelineStore {

    static get STORE_KEY() {
        return "PipelineStore"
    }

    constructor() {
        this.pm = new PracticeManager()
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

        this.buildMonthlyRatios()
        // Building the monthly pipe in respect to total
    }

    buildMonthlyPipeline() {
        let model = []

        // This builds the totals per month
        this.names.forEach( ( name ) => {

            let pipe = { "practice": name, "months": [] }
            model.push( pipe )

            this.months.forEach( ( m ) => {                
                let monthlyPipe = { "month": m.month, isPast: m.isPast }
                pipe.months.push( monthlyPipe )
                let total = { value: 0, count: 0 }
                this.stages.forEach( ( s ) => {
                    monthlyPipe[ s ] = this.sumPipe( this.pm.expand( name ), m.month, s,
                        "_value" )
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

    buildMonthlyRatios() {
        this.monthly.forEach( ( p ) => {
            let total = this.getPipe( p.practice, -1, "Total" )
            p.months.forEach( ( m ) => {
                let monthlyTotal = m[ "Total" ].value
                m.monthlyVsTotal = total !== 0 ? monthlyTotal / total : 0
            } )
        } )
    }

    get total() {
        return this.getPipe( "APJ", -1, "Total" )
    }

    getPipe( practice, month, stage ) {
        let data = this.getMonthData( this.getPracticeData( practice ), month )
        return !!data ? data[ stage ].value : 0
    }

    getPracticeData( practiceName ) {
        let data = this.monthly.find( ( p ) => { return p.practice === practiceName } )
        return !data ? {} : data
    }

    getMonthData( practiceData, month ) {
        return practiceData.months.find( ( m ) => { return m.month === month } )
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

        console.log( "%s New opportunities".green, newData.length - this.store.length );
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
        let { minDate, maxDate } = DateHelper.getMinMaxDates( this.store, "_closeDate" )
        let minD = new DateHelper( minDate )

        this.minDate = minDate
        this.maxDate = maxDate

        this.months = []

        if ( this.minDate !== null && this.maxDate !== null ) {
            for ( let m = this.minDate.getMonth(); m <= this.maxDate.getMonth(); m++ ) {
                this.months.push( { month: m, isPast: minD.isPast( m ) } )
            }
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
