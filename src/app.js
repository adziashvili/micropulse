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
let rh = new ReportHelper( "", today )
let postReportWhiteSpece = 2

let sm = new StoreManager()
sm.utilizationStore.build( names, today )
// Unless building the models (indexes) no data will be presented

console.log( "%s %s (%s records)", "[MICROPULSE]".red, "Jan-June 2018 SalesForce data".grey.italic, sm.utilizationStore.store.length );

let reports = [
    new UtilizationYTDReport( sm.utilizationStore ),
    new UtilizationTripleGreenReport( sm.utilizationStore ),
    new UtilizationAboveSixtyReport( sm.utilizationStore, UtilizationRecord.TYPE_YTD ),
    new UtilizationAboveSixtyReport( sm.utilizationStore, UtilizationRecord.TYPE_MONTHLY ),
    new UtilizationTopBottomReport( sm.utilizationStore, UtilizationTopBottomReport.TOP ),
    new UtilizationTopBottomReport( sm.utilizationStore, UtilizationTopBottomReport.BOTTOM )
]

reports.forEach( ( report ) => {
    report.report()
    rh.addWhiteSpece( postReportWhiteSpece )
} )

// Deep utilization analysis reporting sm.saveAll()
