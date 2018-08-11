const assert = require( 'assert' )

let Excel = require( 'exceljs' )

const REPORT_DATE_CELL = "A6"

export default class SFDCExcelParserBase {

    constructor( ws ) {

        this.ws = ws
        this.records = []

        this.practices = [
            { name: "ANZ", lookup: "ANZ" },
            { name: "ASEAN", lookup: "ASEAN" },
            { name: "INDIA", lookup: "INDIA" },
            { name: "S.KOREA", lookup: "S. KOREA" },
            { name: "APAC", lookup: "APAC" },
            { name: "JAPAN", lookup: "JAPAN" },
            { name: "APJ Shared", lookup: "APJ Shared" },
            { name: "APJ", lookup: "APJ" } ]
    }

    get CELLS() {
        return [ 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K',
                'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
                'W', 'X', 'Y', 'Z' ]
    }

    get NOT_FOUND() {
        return -1
    }

    parse() {
        throw "Exception: You need to implement this method"
    }

    /**
     * Lookups the practice name based on SFDC practice name convention
     *
     * @param {String} str Practice name as in SFDC input file
     *
     * @return {String} The Micropulse convention for the practice name.
     *                  "UNKNOWN" if not found or if lookup str is null or 'undefined'
     */
    lookupPractice( str ) {

        const UNKNOWN = "UNKNOWN"
        let practice = UNKNOWN

        if ( str === null || !str ) {
            return UNKNOWN
        }

        let lookup = this.practices.filter( ( p ) => {
            return p.lookup.toLowerCase() === str.toLowerCase()
        } )

        if ( lookup.length === 1 ) {
            practice = lookup[ 0 ].name
        }

        return practice
    }

    /**
     * Reads a row starting from Col and Row.
     *
     * @param {Number} col Col to start from
     * @param {Number} row Row to scan
     *
     * @return {Array} Returns array of values
     */
    readValues( col, row ) {
        let values = []

        while ( true ) {

            let value = this.ws.getCell( "" + this.CELLS[ col - 1 ] + row )
                .value

            if ( value !== null ) {
                values.push( value )
                col++
            } else {
                break
            }
        }
        return values
    }

    /**
     * Looks for lookup scanning from scanCol downwards
     *
     * @param {string} lookup Value to look for
     *
     * @return {number} the row number where the lookup was found
     */
    scanDown( lookup, scanCol = "A" ) {

        let row = 1
        let value = this.ws.getCell( scanCol + row ).value

        while ( ( value !== null && !!value ) || row < 1000 ) {

            if ( value !== null && !!value && value.toLowerCase().startsWith( lookup.toLowerCase() ) ) {
                return row
            }

            value = this.ws.getCell( scanCol + ( ++row ) ).value
        }

        return this.NOT_FOUND
    }

    /**
     * Reads a cell value
     *
     * @param {String} cell e.g. A7
     *
     * @return {any} As read from the file
     */
    readCell( cell ) {
        return this.ws.getCell( cell ).value
    }

    /**
     * Returns the size of the records loaded
     *
     * @return {[type]} [description]
     */
    get size() {
        return this.records.length
    }

    /**
     * Clones records. Assumes the record have clone method.
     *
     * @return {[type]} [description]
     */
    cloneRecords() {
        let newRecords = []
        this.records.forEach( ( r ) => {
            assert( typeof r.clone === 'function' )
            newRecords.push( r.clone() )
        } )
        return newRecords
    }

    /**
     * Reads the report date.
     *
     * @return {Date} Report date
     */
    getReportDate() {
        let date = this.readCell( REPORT_DATE_CELL )
        if ( null === date ) {
            throw "Can't find report data in " + REPORT_DATE_CELL
        } else {
            // SFDC reports are offset
            return new Date( date.trim() + " UTC" )
        }
    }

}
