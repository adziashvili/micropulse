const path = require( 'path' )
const colors = require( 'colors' )

import { StoreManager, UtilizationRecord, UtilizationStore, UtilizationReader } from './store'
import { UtilizationPulse } from './reports'
import { FSHelper, JSONHelper } from './common'

const REPORT_DATE = new Date( 2018, 7, 30 )

console.clear()

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

let sm = new StoreManager()
sm.utilizationStore.build( names, REPORT_DATE )

function micropulse() {
    new UtilizationPulse( sm.utilizationStore, REPORT_DATE ).run()
}

// Here we start

if ( StoreManager.isNewInputFile() ) {
    // let's resolve new input
    console.log( '[MP] New input file detect. Reconciling ...'.yellow );
    sm.utilizationStore.processNewData( micropulse )

} else {
    micropulse()
}

// sm.saveAll()
