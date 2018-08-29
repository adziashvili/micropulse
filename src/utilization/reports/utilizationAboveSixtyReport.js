import { StringHelper, ReportHelper } from '../../common'
import { UtilizationRecord } from '../model'

export default class UtilizationAboveSixtyReport {
  constructor(store, type) {
    this.store = store
    this.type = type
    this.leaderboard = []
    this.rounds = this.store.date.getMonth()
    this.rh = new ReportHelper(`${type} ABOVE 60% LEADERBOARD`, this.store
      .date)
    this.initialise()
  }

  initialise() {
    const store = this.store
    const model = this.type === UtilizationRecord.TYPE_YTD ?
      store.ytd :
      store.monthly
    const date = store.date

    store.names.forEach(name => this.leaderboard.push({ name, score: 0 }))

    store.names.forEach((name) => {
      for (let m = 0; m < date.getMonth(); m += 1) {
        if (model[name].Total[m] >= 0.6) {
          this.leaderboard.find(candidate => candidate.name === name).score += 1
        }
      }
    })

    this.leaderboard.sort((a, b) => a.score < b.score)
  }

  report() {
    this.rh.addReportTitle()
    this.rh.addSubtitle(`Times ${this.type} utilization was above 60%`)

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
    const successRatioStr = successRatio.toFixed(1)
    return `${name} ${leader.score} times\t${successRatioStr}% of ${this.rounds} rounds`
  }
}
