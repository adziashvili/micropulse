import { UtilizationRecord } from '../store'

const assert = require( 'assert' )

let Excel = require( 'exceljs' )

const CELLS = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M'
]

const NOT_FOUND = -1

let GREADER = null

const DATES_ROW_MARKER = "Resource Practice"
const REPORT_DATE_CELL = "A6"
const UTILIZATION_DATA_FIRST_COL = 3

export default class UtilizationReader {

    constructor() {
        this.practices = [
            {
                name: "ANZ",
                lookup: "ANZ"
            }, {
                name: "ASEAN",
                lookup: "ASEAN"
            }, {
                name: "INDIA",
                lookup: "INDIA"
            }, {
                name: "S.KOREA",
                lookup: "S. KOREA"
            }, {
                name: "APAC",
                lookup: "APAC"
            }, {
                name: "JAPAN",
                lookup: "JAPAN"
            }, {
                name: "APJ Shared",
                lookup: "APJ Shared"
            }, {
                name: "APJ",
                lookup: "APJ"
            }
        ]
        this.records = []
        this.ws = null
    }

    static read( file, utilizationStore ) {
        let wb = new Excel.Workbook()
        let readPromise = wb.xlsx.readFile( file ).then( ( value ) => {
            wb.eachSheet( function ( ws, sheetId ) {
                if ( [ "in", "mp" ].includes( ws.name ) ) {
                    utilizationStore.reader.onWorkshoeetRead( ws )
                    utilizationStore.reconcile()
                }
            } )
        } )
    }

    onWorkshoeetRead( worksheet ) {
        this.ws = worksheet

        let dates = this.readValues( UTILIZATION_DATA_FIRST_COL, this.getAnchorRow( DATES_ROW_MARKER ) )
        dates[dates.length - 1] = dates[dates.length - 2]

        this.practices.forEach( ( practice ) => {

            practice.row = this.getAnchorRow( practice.lookup )

            if ( NOT_FOUND === practice.row ) {
                return
            }

            practice.billable = this.readValues( UTILIZATION_DATA_FIRST_COL, practice.row )
            practice.investment = this.readValues( UTILIZATION_DATA_FIRST_COL, practice.row + 1 )

            let periods = dates.length

            assert( periods === practice.billable.length )
            assert( periods === practice.investment.length )

            for ( let i = 0; i < periods - 1; i++ ) {
                this.records.push( new UtilizationRecord( UtilizationRecord.TYPE_MONTHLY, practice.name, dates[i], practice.billable[i], practice.investment[ i ] ) )
            }

            this.records.push( new UtilizationRecord( UtilizationRecord.TYPE_YTD, practice.name, dates[periods - 1], practice.billable[periods - 1], practice.investment[periods - 1] ) )

        } )
    }

    get size() {
        return this.records.length
    }

    cloneRecords() {
        let newRecords = []
        this.records.forEach( ( r ) => {
            newRecords.push( r.clone() )
        } )
        return newRecords
    }

    /**
     * Reads all values from col at row till it hits a null.
     *
     * @param {Number} col colounm to start from
     * @param {Number} row Row to read
     *
     * @return {[type]} [description]
     */
    readValues( col, row ) {
        let values = []

        while ( true ) {

            let value = this.ws.getCell( "" + CELLS[col - 1] + row ).value

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
     * Captures the row numbers for each practice
     *
     * @param {[type]} practice [description]
     *
     * @return {[type]} [description]
     */
    getAnchorRow( lookup ) {

        let row = 1

        while ( true ) {

            let value = this.ws.getCell( 'A' + row ).value

            if ( null === value || !value ) {
                value = ""
            }

            if ( value.toLowerCase() === lookup.toLowerCase() ) {
                return row
            }

            if ( row++ > 100 ) {
                return NOT_FOUND
            }
        }

        return row
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
     * Reads the report date.
     *
     * @return {Date} Report date
     */
    getReportDate() {
        let date = this.readCell( REPORT_DATE_CELL )

        if ( null === date ) {
            throw "Can't find report data in " + REPORT_DATE_CELL
        }

        let tokens1 = date.split( "/" )
        let tokens2 = tokens1[ 2 ].split( " " )

        return new Date( tokens2[0], tokens1[ 0 ] - 1, tokens1[ 1 ] )
    }
}
