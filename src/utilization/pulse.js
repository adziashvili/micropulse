import {
    UtilizationYTDReport,
    UtilizationTripleGreenReport,
    UtilizationAboveSixtyReport,
    UtilizationTopBottomReport
} from './reports'

import { UtilizationRecord } from './model'
import { ReportHelper } from '../common'

export default class Pulse {

    constructor( utilizationStore, date ) {

        this.store = utilizationStore
        this.rh = new ReportHelper( "", date )
        this.postReportWhiteSpece = 2

        this.reports = [
            new UtilizationYTDReport( this.store ),
            new UtilizationTripleGreenReport( this.store ),
            new UtilizationAboveSixtyReport( this.store,
                UtilizationRecord.TYPE_YTD ),
            new UtilizationAboveSixtyReport( this.store,
                UtilizationRecord.TYPE_MONTHLY ),
            new UtilizationTopBottomReport( this.store,
                UtilizationTopBottomReport.TOP )
        ]
    }

    run() {
        let postReportWhiteSpece = 2

        console.log(
            "%s %s (%s records)", "[MICROPULSE]".red,
            "Jan 01 - Jul 25, 2018 SalesForce data".grey.italic,
            this.store.size );

        this.reports.forEach( ( report ) => {
            report.report( false )
            this.rh.addWhiteSpece( this.postReportWhiteSpece )
        } )

        // this.reports[ 0 ].report( true )
    }
}
