let colors = require( 'colors' )

import { StoreManager, UtilizationRecord, UtilizationStore } from './store'
import { UtilizationYTDReport, UtilizationTripleGreenReport, UtilizationAboveSixtyReport, ReportHelper, UtilizationTopBottomReport } from './reports'
import { FSHelper, JSONHelper } from './common'

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
// This allows easy control the order of the report

let today = new Date( Date.now() )
let sm = new StoreManager()
sm.utilizationStore.build( names, today )
// Unless building the models (indexes) no data will be presented

console.log( "%s %s", "[MICROPULSE]".red, "Based on Jan-June 2018 SalesForce data".grey.italic );

console.log("\n\n\n2018 UTILIZATION... ".bold.cyan);
new UtilizationYTDReport( sm.utilizationStore ).report()
// Main report

console.log("2018 LEADERBOARDS... ".bold.cyan);

new UtilizationTripleGreenReport( sm.utilizationStore ).report()
new UtilizationAboveSixtyReport( sm.utilizationStore, UtilizationRecord.TYPE_YTD ).report()
new UtilizationAboveSixtyReport( sm.utilizationStore, UtilizationRecord.TYPE_MONTHLY ).report()
new UtilizationTopBottomReport( sm.utilizationStore, UtilizationTopBottomReport.TOP ).report()
new UtilizationTopBottomReport( sm.utilizationStore, UtilizationTopBottomReport.BOTTOM ).report()

// Deep utilization analysis reporting sm.saveAll()
