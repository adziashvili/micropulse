import { ReportHelper, StringHelper } from 'ika-helpers'
import UtFollowupReport from './utFollowupReport'

export default class UtilizationTripleGreenReport extends UtFollowupReport {
  constructor(config = undefined, storeManager) {
    super(config, storeManager)
    this.leaderboard = []
    this.rounds = this.verbatim.colCount - 2
    this.rh = new ReportHelper('LEADERBOARD: TRIPLE GREENS')
    this._build()
  }

  _build() {
    this.names.forEach(name => this.leaderboard.push({ name, score: 0 }))
    this.names.forEach((name) => {
      const billables = this.getMonthlyBillableUtilization(name)
      const investments = this.getMonthlyInvestmentUtilization(name)
      for (let m = 0; m < this.rounds; m += 1) {
        if (billables[m + 1] >= 40 && investments[m + 1] >= 20) {
          this.leaderboard.find(candidate => candidate.name === name).score += 1
        }
      }
    })

    this.leaderboard.sort((a, b) => a.score < b.score)
  }

  report() {
    this.rh.addReportTitle()
    const green = 'Green'.green.italic
    this.rh.addSubtitle(`Times a Practice is ${green} on Billable, Investment and Total Utilization`.grey
      .italic)

    let i = 0
    let leader = 1

    while (i < this.leaderboard.length && this.leaderboard[i].score > 0) {
      let position = i > 0 && this.leaderboard[i].score === this.leaderboard[i - 1].score ?
        '' : `#${leader}.`

      leader += 1
      position = StringHelper.exact(position, 3).bold
      console.log('%s %s', position, this.addPosition(this.leaderboard[i]));
      i += 1
    }
  }

  addPosition(leader) {
    const nameStr = StringHelper.exact(leader.name, 10).bold
    const successRatioStr = (leader.score / this.rounds * 100).toFixed(0)
    return `${nameStr} ${leader.score} times \t ${successRatioStr}% of ${this.rounds} rounds`
  }
}
