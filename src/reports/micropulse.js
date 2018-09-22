import {
  BookingsPulse,
  PipelinePulse,
  UtilizationPulse,
  UtilizationAboveSixtyReport,
  UtilizationTripleGreenReport,
  UtilizationTopXReport
} from '.'

import TestPulse from './testPulse'

const bookingsYTD = './data/bookingsYTD.xlsx'
const pipelineYTD = './data/pipelineYTD.xlsx'
const pipeline6Months = './data/pipeline6months.xlsx'
const utilizationYTD = './data/utilizationYTD.xlsx'
const testFile = './data/test.xlsx'

const WAIT_INTERVAL = 100
const TIMEOUT = 2000

export default class MicroPulse {
  constructor(pm) {
    this.pm = pm

    this.reports = [
      // { class: TestPulse, path: testFile },
      { class: PipelinePulse, path: pipelineYTD },
      { class: BookingsPulse, path: bookingsYTD },
      {
        class: UtilizationPulse,
        path: utilizationYTD,
        followups: [
          UtilizationAboveSixtyReport,
          UtilizationTripleGreenReport,
          UtilizationTopXReport
        ]
      },
      { class: PipelinePulse, path: pipeline6Months }
    ]

    this.nextReportIndex = 0
    this.lastReportResult = {}

    this.timeout = 0
    this.isError = false
  }

  get isDone() {
    return this.reports.every(report => report.isDone)
  }

  run(isVerbose = false) {
    this.timeout = 0
    this.isError = false

    return new Promise((resolve, reject) => {
      this.report(resolve, reject, isVerbose)
      this._resolveWhenDone(resolve, reject)
    })
  }

  report(resolve, reject, isVerbose = false) {
    if (this.nextReportIndex === this.reports.length) return undefined

    const { pm, lastReportResult: config } = this
    const nextReportEntry = this.reports[this.nextReportIndex]
    const { class: PulseReport, path, followups } = nextReportEntry
    const report = new PulseReport(path, pm, config)

    const promise = report.configure()

    promise
      .then(() => {
        this.lastReportResult = report.report(isVerbose)
        this.nextReportIndex += 1
        this._followup(followups)
        return this.report(isVerbose)
      })
      .then(() => Object.assign(nextReportEntry, { report, result: this.lastReportResult, isDone: true }))
      .catch((e) => {
        this.isError = true
        this.error = e
        reject(e)
      })

    return promise
  }

  _followup(followups) {
    if (followups) {
      const { pm, lastReportResult: config } = this
      followups.forEach((f) => {
        const FollowupReport = f
        const followup = new FollowupReport(config, pm)
        followup.report()
      })
    }
  }

  _resolveWhenDone(resolve, reject) {
    if (this.isError) {
      return
    }

    if (this.isDone) {
      resolve(this.reports)
      return
    }

    this.timeout += WAIT_INTERVAL
    if (this.timeout <= TIMEOUT) {
      setTimeout(() => { this._resolveWhenDone(resolve, reject) }, WAIT_INTERVAL)
    } else {
      reject(new Error(`TIMEOUT: MicroPulse could not complete within ${this.timeout} ms`.red))
    }
  }
}
