const path = require( 'path' )
const colors = require( 'colors' )

import { StoreManager } from './store'
import { Pulse } from './utilization'
import { FSHelper, JSONHelper } from './common'

const REPORT_DATE = new Date( 2018, 7, 30 )

console.clear()
// Clenaing the concole

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
// Used to force a specific order on the reports so APAC names comes first.

let sm = new StoreManager()
sm.buildAll( names, REPORT_DATE )

function micropulse() {
    new Pulse(
            sm.utilizationStore,
            REPORT_DATE )
        .run()
}

if ( sm.hasNewData() ) {
    console.log( '[MP] New data is avaiallbe. Processing...'.yellow );
    sm.utilizationStore.processNewData( micropulse )
    // resolving new input file Once processed, the reports will be printed
} else {
    micropulse()
    // no file to process Printing out the report
}
