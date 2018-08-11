import { ReportHelper, StringBuffer, StringHelper as SH } from '../../common'

export default class PipelineReport {

    constructor( store ) {
        this.store = store
        this.rh = new ReportHelper( "PIPELINE" )
        this.rh.setDivider( { len: 87 } )
        this.stages = this.store.stages.concat( "Total" )

        this.layout = {
            indent: "  ",
            firstColWidth: 22,
            otherColWidth: 10,
            totalSeperator: "  | "
        }
    }

    report( isVerbose = false ) {
        let {
            indent,
            firstColWidth,
            otherColWidth,
            totalSeperator
        } = this.layout

        let deviderName = [ "APAC", "APJ" ]

        this.rh.addReportTitle()

        this.store.monthly.forEach( ( p ) => {

            if ( p.practice === "APJ Shared" ) { return } // No pipeline here

            this.rh.addDevider( p.practice, deviderName )
            this.rh.addHeaderAsMonthsArray( p.months, p.practice, this.layout )

            this.stages.forEach( ( s ) => {
                let sb = new StringBuffer( indent )
                let isTotal = "Total" === s

                sb.append( SH.exact( isTotal ? "Monthly Total" : s, firstColWidth ).italic )
                p.months.forEach( ( m ) => {
                    if ( m.month === -1 ) { sb.append( totalSeperator ) }
                    let valueString = this.formatValue( m[ s ].value )
                    let coloredValueString = this.redIfs( m[ s ].value,
                        valueString, [ 0 === m[ s ].value, m.isPast ]
                    )
                    sb.append( coloredValueString )
                } )
                console.log( this.boldIf( sb.toString(), isTotal ) )
            } )

            // Ratio of Month Pipe vs. Total Pipe
            this.addTotal( "% vs. PIPELINE", p.months.map( ( m ) => {
                return SH.toPercent( m.monthlyVsTotal )
            } ) )

            if ( isVerbose ) {
                this.addVerbose( p )
            }

            this.rh.addDevider( p.practice, deviderName, true )
            this.rh.newLine()
        } )
    }

    addVerbose( p ) {
        // ADS
        this.rh.newLine()
        this.addTotal( "$ Average Deal Size", p.months.map( ( m ) => {
            return SH.toThousands( m.Total.avg )
        } ) )
        this.addTotal( "# Opportunities", p.months.map( ( m ) => {
            return m.Total.count
        } ) )

        // PA
        this.rh.newLine()
        this.addTotal( "% Partner attached", p.months.map( ( m ) => {
            return SH.toPercent( m.Total.pa.vsCount )
        } ) )
        this.addTotal( "# Partner attached", p.months.map( ( m ) => {
            return m.Total.pa.count
        } ) )

        // AI
        this.rh.newLine()
        this.addTotal( "% With AI", p.months.map( ( m ) => {
            return SH.toPercent( m.Total.ai.vsCount )
        } ) )
        this.addTotal( "# With AI", p.months.map( ( m ) => {
            return m.Total.ai.count
        } ) )

        this.addTotal( "% AI vs. Value", p.months.map( ( m ) => {
            return SH.toPercent( m.Total.ai.vsValue )
        } ) )

        this.addTotal( "$ Avg. AI (when > 0)", p.months.map( ( m ) => {
            return SH.toThousands( m.Total.ai.value )
        } ) )
    }

    addTotal( title, values ) {
        values.unshift( this.layout.indent + title )
        this.rh.addValues( values, this.layout, ( str ) => { return str.grey } )
    }

    redIfs( v, str, conditions = [] ) {
        let match = conditions.some( ( c ) => {
            return c
        } )
        return match ? str.red : str
    }

    formatValue( v ) {
        let prefixed = SH.prefix( SH.toThousands( v ), this.layout.otherColWidth )
        return v === 0 ? prefixed.red : prefixed
    }

    boldIf( str, condition ) {
        return condition ? str.bold : str
    }
}
