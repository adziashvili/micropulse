import { ReportHelper, StringHelper } from 'ika-helpers'
import UtFollowupReport from './utFollowupReport'

export default class UtAboveSixtyReport extends UtFollowupReport {
  constructor(config = undefined, storeManager) {
    super(config, storeManager)

    this.leaderboard = []
    this.rounds = this.verbatim.colCount - 2
    this.rh = new ReportHelper('LEADERBOARD: TOTAL MONTHLY UT ABOVE 60%')
    this._build()
  }

  _build() {
    this.names.forEach(name => this.leaderboard.push({ name, score: 0 }))

    this.names.forEach((name) => {
      const utValues = this.getYTDTotalUtilization(name)
      const timesAboveSixty = this.getTimesAbove(utValues, 60)
      if (timesAboveSixty) {
        this.leaderboard.find(candidate => candidate.name === name).score += timesAboveSixty
      }
    })

    this.leaderboard.sort((a, b) => a.score < b.score)
  }

  report() {
    this.rh.addReportTitle()
    this.rh.addSubtitle('Times monthy utilization was above 60%')

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
    const successRatio = leader.score / this.rounds * 100
    const name = StringHelper.exact(leader.name, 10).bold
    const successRatioStr = successRatio.toFixed(0)
    return `${name} ${leader.score} times \t ${successRatioStr}% of ${this.rounds} rounds`
  }
}
