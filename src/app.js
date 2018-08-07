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

let pm = new PracticeManager()

const names = pm.practices()
// Used to force a specific order on the reports so APAC names comes first.

const REPORT_DATE = new Date( 2018, 7, 30 )
// A date for the reporting cut off

console.clear()
// Clenaing the concole before outputing the report

let sm = new StoreManager()
// Loads the data manager

sm.buildAll( names, REPORT_DATE )
// Asks the store manager to build all the data models

Promise.resolve( true )
    .then( new UtilizationPulse( sm, REPORT_DATE ).run() )
    .then( new PipelinePulse( sm, REPORT_DATE ).run() )
    .then( sm.save() )

// Runs pulse reports
