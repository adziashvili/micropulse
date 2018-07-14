import { UtilizationRecord } from '../store'
import { StringHelper, DateHelper } from '../common'
import { ReportHelper } from '../reports'

const DEVIDER = "---------------------------------------------------------------"

const UP = "\u25B4".green
const DOWN = "\u25Be".red

export default class UtilizationYTDReport {

    constructor( store, names ) {
        this.store = store
        this.reportName = "MONTHLY UTILIZATION | YTD"
        this.rh = new ReportHelper( this.reportName, store.date )
    }

    report() {

        let deviderName = [ "APAC", "APJ" ]

        this.rh.addReportTitle()
        // print report title

        this.store.names.forEach( ( name ) => {

            this.rh.addDevider( name, deviderName )
            // ---

            this.rh.addHeaderAsMonths( name )
            // print headers

            this.store.types.forEach( ( type ) => {
                this.reportUtilization( this.store.monthly[name], this.store.ytd[name], type )
            } )
            this.reportMom( name )
            console.log( "" );
            this.reportAverages( this.store.monthly[ name ]["MoM"], this.store.ytd[ name ][ "MoM" ] )
            console.log( "" );
            // ---
            this.rh.addDevider( name, deviderName, true )

        } )
        // report
    }

    reportUtilization( u, ytd, type ) {

        let uStr = ( StringHelper.padOrTrim( "  " + type, 12 ) ).grey + "\t"

        u[ type ].forEach( ( v ) => {
            uStr += this.format( type, v ) + "\t"
        } )

        uStr += "| " + this.format( type, ytd[ type ][ytd[ type ].length - 1] )

        if ( type === "Total" ) {
            console.log( "%s".bold, uStr );
        } else {
            console.log( uStr );
        }
    }

    reportMom( name ) {

        let uStr = ( StringHelper.padOrTrim( "  MoM", 12 ) ).grey + "\t"

        this.store.monthly[ name ][ "MoM" ].forEach( ( v ) => {
            uStr += this.change( v ) + "\t"
        } )

        uStr += "| " + this.change( this.store.ytd[ name ][ "MoM" ][this.store.ytd[ name ][ "MoM" ].length - 1] )

        console.log( uStr );
    }

    change( v ) {
        return v === 1
            ? "  -  ".grey
            : v > 1
                ? UP + ( " " + ( ( v - 1 ) * 100 ).toFixed(
                    v - 1 > 0.1
                        ? 0
                        : 1
                ) + "%" ).grey
                : DOWN + ( " " + ( ( 1 - v ) * 100 ).toFixed(
                    Math.abs( 1 - v ) > 0.1
                        ? 0
                        : 1
                ) + "%" ).grey

    }

    reportAverages( series, ytd ) {

        let strPrefix = ""
        let iPrefix = 0

        while ( iPrefix++ < ( series.length - 2 ) + 1 ) {
            strPrefix += "\t"
        }

        console.log( "%s5 months avg.:\t%s\t| %s".grey, strPrefix, this.format( "C", this.trailingAverage( series, 5 ), 0, false ), this.format( "C", this.trailingAverage( ytd, 5 ), 0, false ) )
        console.log( "%s3 months avg.:\t%s\t| %s".grey, strPrefix, this.format( "C", this.trailingAverage( series, 3 ), 0, false ), this.format( "C", this.trailingAverage( ytd, 3 ), 0, false ) )
        console.log( "%s2 months avg.:\t%s\t| %s".grey, strPrefix, this.format( "C", this.trailingAverage( series, 2 ), 0, false ), this.format( "C", this.trailingAverage( ytd, 2 ), 0, false ) )
    }

    trailingAverage( series, periods ) {
        let count = periods,
            sum = 0,
            len = series.length

        while ( count > 0 ) {
            sum += series[len - count] - 1
            count--
        }

        return sum / periods
    }

    format( valueType, value, digits = 1, bPad = true, bSymbol ) {

        let valueString = ( Math.abs( value ) * 100 ).toFixed( digits ) + "%"

        valueString = valueString.length < 5 && bPad
            ? "0" + valueString
            : valueString

        switch ( valueType ) {
            case "Billable":
                return this.trafficLights( value, valueString, 0.4, 0.4 * 0.8 )
                break
            case "Investment":
                return this.trafficLights( value, valueString, 0.2, 0.2 * 0.8 )
                break
            case "Total":
                return this.trafficLights( value, valueString, 0.6, 0.6 * 0.8 )
                break
            default:
                return this.addSymbol( value, this.changeLights( value, valueString ) )
        }
    }

    trafficLights( value, valueString, greenThreahold, ameberThreahold ) {
        return value >= greenThreahold
            ? valueString.green
            : value >= ameberThreahold
                ? valueString.yellow
                : valueString.red
    }

    changeLights( value, valueString ) {
        return value > 0
            ? valueString.green
            : value < 0
                ? valueString.red
                : valueString.grey
    }

    addSymbol( v, vStr ) {
        return v > 0
            ? UP + " " + vStr
            : v < 0
                ? DOWN + " " + vStr
                : vStr
    }
}
