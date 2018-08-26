const path = require( 'path' )
const colors = require( 'colors' )

import { StoreManager } from './store'
import { UtilizationPulse } from './utilization'
import { PipelinePulse, PipelinePulseNew } from './pipeline'
import { BookingsPulse } from './bookings'
import { PracticeManager } from './managers'

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
    .then( new PipelinePulseNew( "./data/pipelineTest.xlsx" ).run( isVerbose ) )
    .then( sm.save() )

// Runs pulse reports
