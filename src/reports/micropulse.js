import {
  BookingsPulse,
  PipelinePulse,
  UtilizationPulseNew,
  UtilizationAboveSixtyReport,
  UtilizationTripleGreenReport,
  UtilizationTopXReport
} from '.'

const bookingsYTD = './data/bookingsYTD.xlsx'
const pipelineYTD = './data/pipelineYTD.xlsx'
const pipeline6Months = './data/pipeline6months.xlsx'
const utilizationYTD = './data/utilizationYTD.xlsx'

export default class MicroPulse {
  constructor(sm) {
    this.sm = sm

    this.reports = [
      { class: PipelinePulse, path: pipelineYTD },
      { class: BookingsPulse, path: bookingsYTD },
      {
        class: UtilizationPulseNew,
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
  }

  report(isVerbose = false) {
    if (this.nextReportIndex === this.reports.length) return

    const { sm, lastReportResult: config } = this
    const { class: PulseReport, path, followups } = this.reports[this.nextReportIndex]
    const report = new PulseReport(path, sm, config)

    const promise = report.configure()
    promise
      .then(result => report.report(isVerbose))
      .then((result) => {
        this.lastReportResult = result
        this.nextReportIndex += 1
        if (followups) {
          followups.forEach((f) => {
            const FollowupReport = f
            const followup = new FollowupReport(result, sm)
            followup.report()
          })
        }
      })
      .then(result => this.report(isVerbose))
      .catch((e) => {
        e.message = `'MicroPulse Ooops! ${e.message}`.red.bold
        throw e // rejects the promise to report
      })
  }
}
