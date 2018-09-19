import {
  BookingsPulse,
  PipelinePulse,
  UtilizationPulse,
  UtilizationAboveSixtyReport,
  UtilizationTripleGreenReport,
  UtilizationTopXReport
} from '.'

const bookingsYTD = './data/bookingsYTD.xlsx'
const pipelineYTD = './data/pipelineYTD.xlsx'
const pipeline6Months = './data/pipeline6months.xlsx'
const utilizationYTD = './data/utilizationYTD.xlsx'

const WAIT_INTERVAL = 100
const TIMEOUT = 2000

export default class MicroPulse {
  constructor(sm) {
    this.sm = sm

    this.reports = [
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
  }

  get isDone() {
    return this.reports.every(report => report.isDone)
  }

  run(isVerbose = false) {
    this.timeout = 0
    return new Promise((resolve, reject) => {
      this.report(isVerbose)
      this._resolveWhenDone(resolve, reject)
    })
  }

  report(isVerbose = false) {
    if (this.nextReportIndex === this.reports.length) return undefined

    const { sm, lastReportResult: config } = this
    const nextReportEntry = this.reports[this.nextReportIndex]
    const { class: PulseReport, path, followups } = nextReportEntry
    const report = new PulseReport(path, sm, config)

    const promise = report.configure()
    promise
      .then(result => report.report(isVerbose))
      .then((result) => {
        this.lastReportResult = result
        this.nextReportIndex += 1
        this._followup(followups)
      })
      .then(result => this.report(isVerbose))
      .then(result => Object.assign(nextReportEntry, {
        report,
        result: this.lastReportResult,
        isDone: true
      }))
      .catch((e) => {
        e.message = `'MicroPulse Ooops! ${e.message}`.red.bold
        throw e
      })

    return promise
  }

  _followup(followups) {
    if (followups) {
      const { sm, lastReportResult: config } = this
      followups.forEach((f) => {
        const FollowupReport = f
        const followup = new FollowupReport(config, sm)
        followup.report()
      })
    }
  }

  _resolveWhenDone(resolve, reject) {
    if (this.isDone) {
      this.timeout = 0
      resolve(this.reports)
      return
    }

    this.timeout += WAIT_INTERVAL
    if (this.timeout <= TIMEOUT) {
      setTimeout(() => { this._resolveWhenDone(resolve) }, WAIT_INTERVAL)
    } else {
      console.log(`WARNING: Could not complete in ${this.timeout} ms`.red)
      this.timeout = 0
      reject({})
    }
  }
}
