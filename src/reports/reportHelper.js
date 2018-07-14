import { StringHelper, DateHelper } from '../common'

const DEVIDER = "----------------------------------------------------------------"
// Report devider

/**
 * An aggregation of utilities needed for consistent and quick reporting formating.
 *
 * @type {Class}
 */
export default class ReportHelper {

    /**
     * Pass the required two inputs NAME for the report and DATE.
     *
     * @param {String} reportName Name of the report
     * @param {Date} date The daye for which the rpeort is generated for.
     */
    constructor( reportName, date ) {
        this.reportName = reportName
        this.date = date
    }

    /**
     * Prints a bold underline title string as passed in the constructor reportName
     *
     * @param {[type]} newTitle     Prints this title instead of the rpeort name
     * @param {Number} [newlines=0] Add new lines as defined in this input parameter
     */
    addReportTitle( newTitle, newlines = 0 ) {

        let title = !newTitle
            ? this.reportName
            : newTitle

        this.addWhiteSpece( newlines )
        console.log( "%s", title.bold.underline );
    }

    /**
     * Add few new lines to stdout.
     *
     * @param {Number} [newlines=1] Number of new lines to add. By default 1
     */
    addWhiteSpece( newlines = 1 ) {
        let whiteSpace = ""
        while ( newlines-- > 0 ) {
            whiteSpace += "\n"
        }

        console.log( whiteSpace );
    }

    /**
     * Add a grey italic subtitle to the stdout
     *
     * @param {String} subtitle Subtitle to print
     */
    addSubtitle( subtitle ) {
        console.log( "%s\n".grey.italic, subtitle );
    }

    /**
     * Adds a devider <i>DEVIDER</i> to the stdout.
     *
     * @param {String}  [name=""]             Name to check agasint the addOnlyForNames input.
     * @param {Array}   [addOnlyForNames=[]]  Qualifies the name. If this array of strings includes the name, the devider will be printed
     * @param {Boolean} [bAddNewLine=false]   If true, a new line will be added before the devider
     */
    addDevider( name = "", addOnlyForNames = [], bAddNewLine = false ) {

        if ( addOnlyForNames.length === 0 || addOnlyForNames.includes( name ) ) {
            let deviderString = DEVIDER
            if ( bAddNewLine ) {
                deviderString += "\n"
            }
            console.log( deviderString.grey );
        }
    }

    /**
     * Add month names to a prefix (e.g. Name)
     *
     * @param {String} [prefix=""] Baseline of the colounm row
     * @param {Date} toMonth     How many months to add
     */
    addHeaderAsMonths( prefix = "", toMonth ) {

        toMonth = !toMonth
            ? this.date.getMonth()
            : toMonth

        let header = StringHelper.padOrTrim( prefix, 12 )

        for ( let month = 0; month < toMonth; month++ ) {
            header += "\t " + DateHelper.getMonthName( month )
        }

        header += "\t|  YTD"
        // print col titles

        console.log( "\n%s".bold, header )
        // print title
    }

}
