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

        this.buildMonthlyRollups()
        // Per month per stage, calculates rollups for Total, AI and PA

        this.buildTotals()
        // Add totals to the monthly model (i.e. total pipe by stage).
        // This also rolls up the various stats like PA and AI

        this.buildMonthlyRatios()
        // Building the monthly pipe in respect to total pipe value
    }

    buildMonthlyPipeline() {

        let model = []
        this.names.forEach( ( name ) => {
            let pipe = { "practice": name, "months": [] }
            model.push( pipe )
            this.months.forEach( ( m ) => {
                let mp = { "month": m.month, isPast: m.isPast }
                this.stages.forEach( ( s ) => {
                    mp[ s ] = this.stats( this.pm.expand( name ), m.month, s )
                } )
                pipe.months.push( mp )
            } )
        } )

        return model
    }

    buildMonthlyRollups() {
        this.monthly.forEach( ( p ) => {
            p.months.forEach( ( m ) => {
                let rollups = this.rollup( [ m ] )
                m.pa = rollups.pa
                m.ai = rollups.ai
                m.Total = rollups.t
            } )
        } )
    }

    rollup( ms = [] ) {
        let pa = { count: 0, vsCount: 0 } // Partner Attach
        let ai = { value: 0, count: 0, avg: 0, vsValue: 0, vsCount: 0 } // Adoption Incentive
        let t = { value: 0, count: 0, avg: 0 } // Total that cuts across stage values

        ms.forEach( ( m ) => {
            if ( m.month === -1 ) { return } // we should not rollup the last month
            this.stages.forEach( ( s ) => {
                pa.count += m[ s ].pa.count
                ai.value = this.add( ai.value, m[ s ].ai.value )
                ai.count += m[ s ].ai.count
                t.value = this.add( t.value, m[ s ].value )
                t.count += m[ s ].count
            } )
        } )

        pa.vsCount = this.divide( pa.count, t.count )
        ai.avg = this.divide( ai.value, ai.count )
        ai.vsValue = this.divide( ai.value, t.value )
        ai.vsCount = this.divide( ai.count, t.count )
        t.avg = this.divide( t.value, t.count )

        return { pa, ai, t }
    }

    buildTotals() {
        this.monthly.forEach( ( p ) => {

            let pt = {
                "month": -1,
                isPast: false,
            }

            this.stages.forEach( ( s ) => {
                pt[ s ] = { value: 0, count: 0, avg: 0 }
                p.months.forEach( ( m ) => {
                    pt[ s ].value = this.add( pt[ s ].value, m[ s ].value )
                    pt[ s ].count += m[ s ].count
                } )
            } )

            let rollups = this.rollup( p.months )
            pt.pa = rollups.pa
            pt.ai = rollups.ai
            pt.Total = rollups.t

            p.months.push( pt )
        } )
    }

    buildMonthlyRatios() {
        this.monthly.forEach( ( p ) => {
            let total = this.getPipe( p.practice, -1, "Total" )
            p.months.forEach( ( m ) => {
                m.monthlyVsTotal = this.divide( m[ "Total" ].value , total )                
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

    add( a, b ) {
        return this.fixed( a + b )
    }

    divide( x, y ) {
        return ( x / ( y === 0 ? 1 : y ) ).toFixed( 3 )
    }

    fixed( num ) {
        return num.toFixed( 2 ) * 1
    }

    stats( practices, month, stage ) {

        let pipe = this.store.filter( ( p ) => {
            return practices.includes( p.practice ) &&
                p.closeDate.getMonth() === month &&
                p.stage === stage
        } )

        let value = this.sum( pipe, "_value" )
        let count = pipe.length
        let avg = this.divide( value, count )
        // Stage top line stats

        let pa = this.statsPa( pipe, count )
        let ai = this.statsAi( pipe, value, count )
        // Stage extra stats

        return { value, count, avg, pa, ai }
    }

    statsPa( pipe, count ) {
        let pa = this.countIf( pipe, "_pa", ( i ) => { return i } )
        return {
            count: pa,
            vsCount: ( pa / ( count === 0 ? 1 : count ) ).toFixed( 3 ) * 1
        }
    }

    statsAi( pipe, value, count ) {

        let ai = {
            value: 0,
            count: 0,
            avg: 0,
            vsCount: 0,
            vsValue: 0
        }

        pipe.forEach( ( p ) => {
            if ( p.ai > 0 ) {
                ai.value += p.ai
                ai.count++
            }
        } )

        ai.avg = this.divide( ai.value, ai.count )
        ai.vsCount = this.divide( ai.count, count )
        ai.vsValue = this.divide( ai.value, value )

        return ai
    }

    sum( list, property ) {
        let sum = 0
        list.forEach( ( item ) => {
            sum += item[ property ]
        } )
        return sum.toFixed( 2 ) * 1
    }

    countIf( list, property, evaluator ) {
        let count = 0
        list.forEach( ( item ) => {
            if ( evaluator( item[ property ] ) ) {
                count++
            }
        } )
        return count
    }
}
