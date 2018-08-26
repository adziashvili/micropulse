const path = require( 'path' )
const colors = require( 'colors' )

import { StoreManager } from './store'
import { UtilizationPulse } from './utilization'
import { PipelinePulse } from './pipeline'
import { BookingsPulse } from './bookings'
import { PracticeManager } from './managers'

import {
    FSHelper,
    JSONHelper,
    ExcelReader,
    DateHelper,
    StringHelper
} from './common'

import {
    Table,
    Modeler,
    Reporter,
    Dictionary,
    Analyzer
} from './common'

let pm = new PracticeManager()

const names = pm.practices()
// Used to force a specific order on the reports so APAC names comes first.

const REPORT_DATE = new Date( "8/31/2018 23:59:59 GMT-7" )
// A date for the reporting cut off

console.clear()
// Clenaing the concole before outputing the report

let sm = new StoreManager()
// Loads the data manager

sm.buildAll( names, REPORT_DATE )
// Asks the store manager to build all the data models

let isVerbose = false

Promise.resolve( true )
    .then( new UtilizationPulse( sm, REPORT_DATE ).run( isVerbose ) )
    .then( new PipelinePulse( sm, REPORT_DATE ).run( isVerbose ) )
    .then( new BookingsPulse( "./data/bookings2.xlsx" ).run( isVerbose ) )
    .then( sm.save() )

let table = new Table()
let file = "./data/pipelineTest.xlsx"

new ExcelReader
    // .load( "./data/bookings.xlsx" )
    .load( file )
    .then( ( data ) => {
        table.process( data.getWorksheet( data.worksheets[ 0 ].id ) )
        let modeler = new Modeler( table )
        let dictionary = new Dictionary( [
            { key: 'Practice', shortName: 'Practice' },
            { key: 'Close Date', shortName: 'Close Data' },
            { key: 'Account Name', shortName: 'Account' },
            { key: 'Opportunity Name', shortName: 'Opportunity' },
            { key: 'Forecast Status', shortName: 'Forecast' },
            { key: 'Total Contract Amount (converted)', shortName: 'Amount' },
            { key: 'Influenced Revenue (converted)', shortName: 'Influenced Revenue' },
            { key: 'Adoption Incentive Amount (converted)', shortName: 'Adoption Incentive' },
            { key: 'Project Duration (mos)', shortName: 'Duration( m )' },
            { key: 'Probability (%)', shortName: 'Probability' },
            { key: 'Opportunity Owner', shortName: 'Owner' },
            { key: 'Stage', shortName: 'Stage' },
            { key: 'Is Partner Account Involved?', shortName: 'Partner Attached' } ] )

        modeler.cols = [ { key: 'Close Date', transform: ( d ) => { return DateHelper.getMonthYear( d ) } } ]
        modeler.rows = [ { key: "Practice" }, { key: "Stage" } ]

        // Stats settings can inlcude the key to indicate which stat we would like to show case
        modeler.stats = [
            { key: 'Total Contract Amount (converted)' },
            { key: 'Project Duration (mos)' },
            { key: 'Is Partner Account Involved?' },
            { key: 'Close Date' } ]

        // We can pass a transformer to caluclate values or to caluclate the entire row.
        // Add isRowTransformer: true for row
        modeler.custom = [
            { key: "Record Count", transform: ( records, modeler, allColsRecords ) => { return records.length } },
            {
                key: "Record Count MoM (| AVG)",
                isRowTransformer: true,
                transform: ( records, modeler, allColsRecords ) => {
                    let mom = Analyzer.PoP( allColsRecords, ( v ) => {
                        return v.length
                    } )
                    mom[ mom.length - 1 ] = Analyzer.avg( mom.slice( 0, mom.length - 1 ) )
                    return mom.map( ( m ) => { return StringHelper.toPercent( m ) } )
                }
            } ]

        modeler.build()
        let reporter = new Reporter( modeler )
        reporter.dictionary = dictionary
        reporter.report( true )
    } )
    .catch( ( e ) => {
        console.log( "Ooops! We have an Error reading file.".red, file );
        console.log( e )
        throw e
    } )

// Runs pulse reports
