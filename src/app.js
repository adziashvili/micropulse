const path = require( 'path' )
const colors = require( 'colors' )

import { StoreManager } from './store'
import { UtilizationPulse } from './utilization'
import { PipelinePulse } from './pipeline'
import { PracticeManager } from './managers'

import {
    FSHelper,
    JSONHelper,
    ExcelReader
} from './common'

import { Table, Modeler } from './common'

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

Promise.resolve( true )
    .then( new UtilizationPulse( sm, REPORT_DATE ).run( true ) )
    .then( new PipelinePulse( sm, REPORT_DATE ).run( true ) )
    .then( sm.save() )

// let table = new Table()
// let file = "./data/pipelineTest.xlsx"
//
// new ExcelReader
//     // .load( "./data/bookings.xlsx" )
//     .load( file )
//     .then( ( data ) => {
//         table.process( data.getWorksheet( data.worksheets[ 0 ].id ) )
//         let modeler = new Modeler( table )
//
//         modeler.rows = [
//             { key: "Practice", transform: null },
//             { key: "Stage", transform: null } ]
//
//         modeler.cols = [
//             { key: 'Is Partner Account Involved?', transform: null },
//             { key: 'Forecast Status', transform: null } ]
//
//         modeler.model()
//     } )
//     .catch( ( e ) => {
//         console.log( "Ooops! We have an Error reading file.".red, file );
//         console.log( e )
//         throw e
//     } )

// Runs pulse reports
