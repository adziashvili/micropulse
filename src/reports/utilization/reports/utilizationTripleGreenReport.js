import { ReportHelper, StringHelper } from 'ika-helpers'

export default class UtilizationTripleGreenReport {
  constructor(store) {
    this.store = store
    this.leaderboard = []
    this.rounds = this.store.date.getMonth()
    this.rh = new ReportHelper('TRIPLE GREEN LEADERBOARD', this.store.date)
    this.initialise()
  }

  initialise() {
    const store = this.store
    const monthly = store.monthly
    const date = store.date

    store.names.forEach((name) => {
      this.leaderboard.push({ name, score: 0 })
    })

    store.names.forEach((name) => {
      for (let m = 0; m < date.getMonth(); m += 1) {
        if (monthly[name].Billable[m] >= 0.4 && monthly[name].Investment[m] >= 0.2) {
          this.leaderboard.find(candidate => candidate.name === name).score += 1
        }
      }
    })

    this.leaderboard.sort((a, b) => a.score < b.score)
  }

  report() {
    this.rh.addReportTitle()
    const green = 'Green'.green.italic
    this.rh.addSubtitle(`Practice is ${green} on Billable, Investment and Total Utilization`.grey.italic)

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
    const successRatioStr = (leader.score / this.rounds * 100).toFixed(1)
    const nameStr = StringHelper.exact(leader.name, 10).bold
    return `${nameStr}$${leader.score} times\t${successRatioStr} % of ${this.rounds} rounds`
  }
}
