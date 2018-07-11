let colors = require( 'colors' )

import { StoreManager, UtilizationRecord, UtilizationStore } from './store'
import { UtilizationYTDReport } from './reports'
import { FSHelper, JSONHelper } from './common'

console.log( "[MICROPULSE] Start\n".red );

let sm = new StoreManager()
let store = sm.utilizationStore

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

new UtilizationYTDReport( store, names ).report()

// sm.saveAll()

console.log( "\n[MICROPULSE] End :)\n".red );
