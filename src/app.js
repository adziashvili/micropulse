const path = require( 'path' )
const colors = require( 'colors' )

import { StoreManager, UtilizationRecord, UtilizationStore, UtilizationReader } from './store'
import { UtilizationPulse } from './reports'
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
sm.utilizationStore.build( names, REPORT_DATE )

function micropulse() {
    new UtilizationPulse( sm.utilizationStore, REPORT_DATE )
        .run()
}

if ( StoreManager.isNewInputFile() ) {
    console.log( '[MP] New input file detect. Reconciling ...'.yellow );
    sm.utilizationStore.processNewData( micropulse )
    // resolving new input file Once processed, the reports will be printed
} else {
    micropulse()
    // no file to process Printing out the report
}

sm.saveAll()
