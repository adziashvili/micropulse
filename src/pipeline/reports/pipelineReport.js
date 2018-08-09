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

    report() {
        let {
            indent,
            firstColWidth,
            otherColWidth,
            totalSeperator
        } = this.layout
        let deviderName = [ "APAC", "APJ" ]

        this.rh.addReportTitle()
        this.store.monthly.forEach( ( p ) => {

            if ( p.practice === "APJ Shared" ) { return } // SKIP

            this.rh.addDevider( p.practice, deviderName )
            this.rh.addHeaderAsMonthsArray( p.months, p.practice, this.layout )

            this.stages.forEach( ( s ) => {
                let sb = new StringBuffer( indent )
                let isTotal = "Total" === s

                sb.append( SH.exact( isTotal ? "Monthly Total" : s, firstColWidth ).italic.grey )
                p.months.forEach( ( m ) => {
                    if ( m.month === -1 ) { sb.append( totalSeperator ) }
                    let valueString = this.formatValue( m[ s ].value )
                    let coloredValueString = this.redIfs( m[ s ].value,
                        valueString, [ 0 === m[ s ].value, m.isPast ]
                    )
                    sb.append( coloredValueString )
                } )

                // if ( isTotal ) { sb.newLine() }
                console.log( this.boldIf( sb.toString(), isTotal ) )
            } )

            this.addRatios( p.months )
            this.rh.addDevider( p.practice, deviderName, true )
            this.rh.newLine()
        } )
    }

    addRatios( months ) {
        let ratios = months.map( ( m ) => {
            return this.toPercent( m.monthlyVsTotal )
        } )
        ratios.unshift( this.layout.indent + "Monthly vs. Total" )
        this.rh.addValues( ratios, this.layout, ( str ) => { return str.grey } )
    }

    toPercent( zeroToOneNumber ) {
        return ( zeroToOneNumber * 100 ).toFixed( 1 ) + "%"
    }

    toThousands( num ) {
        return SH.addCommas( ( num / 1000 ).toFixed( 0 ) )
    }

    redIfZero( num, str ) {
        return num === 0 ? str.red : str
    }

    redIfs( v, str, conditions = [] ) {
        let match = conditions.some( ( c ) => {
            return c
        } )

        return match ? str.red : str
    }

    formatValue( v ) {
        let strValue = v === 0 ? "-" : this.toThousands( v )
        let prefixed = SH.prefix( strValue, this.layout.otherColWidth )

        return v === 0 ? prefixed.red : prefixed
    }

    boldIf( str, condition ) {
        return condition ? str.bold : str
    }
}
