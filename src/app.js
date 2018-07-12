let colors = require( 'colors' )

import { StoreManager, UtilizationRecord, UtilizationStore } from './store'
import { UtilizationYTDReport, UtilizationTripleGreenReport, UtilizationAboveSixtyReport, ReportHelper } from './reports'
import { FSHelper, JSONHelper } from './common'

console.clear()
console.log( "[MICROPULSE] Start".red );

let names = [
    "ANZ",
    "ASEAN",
    "INDIA",
    "S.KOREA",
    "APAC",
    "JAPAN",
    "APJ Shared",
    "APJ"
]

let today = new Date( Date.now() )

let sm = new StoreManager()
// data should be loaded to stores

sm.utilizationStore.build( names, today )
// building the models

new UtilizationTripleGreenReport( sm.utilizationStore ).report()

new UtilizationAboveSixtyReport( sm.utilizationStore, UtilizationRecord.TYPE_YTD ).report()
new UtilizationAboveSixtyReport( sm.utilizationStore, UtilizationRecord.TYPE_MONTHLY ).report()

new UtilizationYTDReport( sm.utilizationStore ).report()
// reporting sm.saveAll()

console.log( "\n[MICROPULSE] End :)\n".red );
