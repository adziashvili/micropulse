import {StringHelper, DateHelper } from '../common'

const DEVIDER = "----------------------------------------------------------------"

export default class ReportHelper {

    constructor( reportName, date ) {
        this.reportName = reportName
        this.date = date
        this.dh = new DateHelper( this.date )
    }

    addReportTitle( newTitle ) {

        let title = !newTitle
            ? this.reportName
            : newTitle

        console.log( "\n\n\n%s\n%s", title.bold.underline, this.dh.localeDateString.grey.italic );        
    }

    addDevider( name = "", addForNames = [], bAddNewLine = false ) {

        if ( addForNames.length === 0 || addForNames.includes( name ) ) {
            let deviderString = DEVIDER
            if ( bAddNewLine ) {
                deviderString += "\n"
            }
            console.log( deviderString.grey );
        }
    }

    addHeaderAsMonths( prefix = "", toMonth ) {

        toMonth = !toMonth
            ? this.date.getMonth()
            : toMonth

        let header = StringHelper.padOrTrim( prefix, 12 )

        for ( let month = 0; month < toMonth; month++ ) {
            header += "\t" + DateHelper.getMonthName( month )
        }

        header +="\t| YTD"
        // print col titles

        console.log( "\n%s".bold, header )
        // print title
    }

}
