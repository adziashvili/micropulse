import { ReportHelper } from 'ika-helpers'

import {
  UtilizationYTDReport,
  UtilizationTripleGreenReport,
  UtilizationAboveSixtyReport,
  UtilizationTopBottomReport
} from './reports'

import { UtilizationRecord, UtilizationStore } from './model'

export default class UtilizationPulse {
  constructor(storeManager, date) {
    this.sm = storeManager
    this.store = this.sm.utilizationStore
    this.rh = new ReportHelper('', date)
    this.postReportWhiteSpece = 2

    this.reports = [
      new UtilizationYTDReport(this.store),
      new UtilizationTripleGreenReport(this.store),
      new UtilizationAboveSixtyReport(this.store, UtilizationRecord.TYPE_YTD),
      new UtilizationAboveSixtyReport(this.store, UtilizationRecord.TYPE_MONTHLY),
      new UtilizationTopBottomReport(this.store, UtilizationTopBottomReport.TOP)
    ]
  }

  report(isVerbose = false) {
    console.log('%s %s (%s records)',
      '[MICROPULSE]'.red,
      'Jan 01 - Jul 25, 2018 SalesForce data'.grey.italic,
      this.store.size)

    this.reports.forEach((report) => {
      report.report(isVerbose)
      this.rh.addWhiteSpece(this.postReportWhiteSpece)
    })
    // this.reports[ 0 ].report( true )
  }

  run(isVerbose = false) {
    let isSuccess = true

    this.sm.readNewData(UtilizationStore.STORE_KEY)
      .then((data) => {
        if (data !== null) {
          this.store.reconcile(data.getWorksheet(data.worksheets[0].id))
          this.sm.commit(this.store.storeKey)
        }
        this.report(isVerbose)
      }).catch((e) => {
        isSuccess = false
        console.log('Ooops! We have an Error reading new data.'.red);
        console.log(e)
        throw e
      })

    return Promise.resolve(isSuccess)
  }
}
