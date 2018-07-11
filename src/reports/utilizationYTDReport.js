const assert = require( 'assert' )

import { UtilizationRecord } from '../store'
import { StringHelper, DateHelper } from '../common'

export default class UtilizationYTDReport {

    constructor( store, names ) {
        this.utils = []
        this.names = names
        this.store = store

        this.types = [ "Billable", "Investment", "Total" ]
    }

    report() {

        let today = new Date( Date.now() )
        let dh = new DateHelper( today )

        console.log( "\n%s\n%s", "Utilization YTD".bold, dh.localeDateString.grey );
        console.log( "---------------------------------------------------------------".grey );

        let titleString = StringHelper.padOrTrim( "", 12 )
        for ( let month = 0; month < today.getMonth(); month++ ) {
            titleString += "\t" + DateHelper.getMonthName( month )
        }
        // print col titles

        console.log( "\n%s".bold, titleString )
        // print title

        this.names.forEach( ( name ) => {
            if ( [ "APAC", "APJ" ].includes( name ) ) {
                console.log( "---------------------------------------------------------------".grey );
            }
            console.log( "%s".bold, name )
            this.types.forEach( ( type ) => {
                this.addUtilization( name, type, today )
                this.reportUtilization( this.utils[name], type )

            } )
            this.reportMom( name )
            this.reportInsights( this.utils[ name ][ "MoM" ] )
            if ( [ "APAC", "APJ" ].includes( name ) ) {
                console.log( "---------------------------------------------------------------\n".grey );
            }
        } )
        // report basics

        console.log( "RAISE THE BAR (TRIPLE GREEN) LEADERBOARD".green )

        console.log( "ABOVE THE BAR (>60%) LEADERBOARD".green )

        console.log( "STEADY (REPEATS)".green )

    }

    reportMom( name ) {

        this.utils[ name ][ "MoM" ] = [ 1 ]

        let changes = this.utils[ name ][ "MoM" ]
        let values = this.utils[ name ].Total

        for ( let i = 1; i < values.length; i++ ) {
            let change = values[ i ] / (
                values[i - 1] === 0
                    ? 1
                    : values[i - 1]
            )
            changes.push( values[ i ] / values[i - 1] )
        }

        let uStr = ( StringHelper.padOrTrim( "  MoM", 12 ) ).grey + "\t"

        changes.forEach( ( v ) => {
            uStr += (
                v === 1
                    ? "  -  ".grey
                    : v > 1
                        ? "\u25B2".green + ( " " + ( ( v - 1 ) * 100 ).toFixed(
                            v - 1 > 0.1
                                ? 0
                                : 1
                        ) + "%" ).grey
                        : "\u25BC".red + ( " " + ( ( 1 - v ) * 100 ).toFixed(
                            Math.abs( 1 - v ) > 0.1
                                ? 0
                                : 1
                        ) + "%" ).grey
            ) + "\t"
        } )

        console.log( uStr );
    }

    reportInsights( series ) {

        let twoMonthChange = this.trailingAverage( series, 2 )
        let threeMonthChange = this.trailingAverage( series, 3 )
        let sixMonthChange = this.trailingAverage( series, 6 )

        console.log( "\t\t\t\t6 months avg. change:\t %s%".grey, ( sixMonthChange * 100 ).toFixed( 1 ) )
        console.log( "\t\t\t\t3 months avg. change:\t %s%".grey, ( threeMonthChange * 100 ).toFixed( 1 ) )
        console.log( "\t\t\t\t2 months avg. change:\t %s%".grey, ( twoMonthChange * 100 ).toFixed( 1 ) )
    }

    trailingAverage( series, size ) {
        let i = 1,
            sum = 0,
            len = series.length

        do {
            sum += this.absChange( series[len - i] )
            i++
        } while ( i <= size )

        return sum / size
    }

    absChange( change ) {
        return ( change - 1 ) >= 0
            ? change - 1
            : 1 - change
    }

    reportUtilization( u, type ) {

        let uStr = ( StringHelper.padOrTrim( "  " + type, 12 ) ).grey + "\t"

        u[ type ].forEach( ( v ) => {
            uStr += this.format( type, v ) + "\t"
        } )

        if ( type === "Total" ) {
            console.log( "%s".bold, uStr );
        } else {
            console.log( uStr );
        }

    }

    addUtilization( name, valueType, today ) {

        if ( !this.utils[ name ] ) {
            this.utils[ name ] = {}
        }

        this.utils[ name ][ valueType ] = []

        for ( let m = 0; m < today.getMonth(); m++ ) {
            let records = this.store.getLatest( UtilizationRecord.TYPE_MONTHLY, name, today.getFullYear(), m )
            assert( records.length <= 1 )

            let utilization = records.length === 0
                ? 0
                : valueType === "Billable"
                    ? records[ 0 ].billable
                    : valueType === "Investment"
                        ? records[ 0 ].investment
                        : records[ 0 ].total

            this.utils[ name ][ valueType ][ m ] = Math.round( utilization * 1000 ) / 1000
        }
    }

    format( valueType, value ) {

        let valueString = ( value * 100 ).toFixed( 2 ) + "%"

        valueString = valueString.length < 6
            ? "0" + valueString
            : valueString

        switch ( valueType ) {
            case "Billable":
                return this.trafficLights( value, valueString, 0.4, 0.4 * 0.8 )
                break
            case "Investment":
                return this.trafficLights( value, valueString, 0.2, 0.2 * 0.8 )
                break
            default:
                return this.trafficLights( value, valueString, 0.6, 0.6 * 0.8 )
        }
    }

    trafficLights( value, valueString, greenThreahold, ameberThreahold ) {
        return value >= greenThreahold
            ? valueString.green
            : value >= ameberThreahold
                ? valueString.yellow
                : valueString.red
    }
}
