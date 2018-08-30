import { DateHelper, ReportHelper } from '../../../common'

export default class UtilizationTopBottomReport {
  static get BURNOUT_FLAG() {
    return '*'.red.italic
  }

  static get NEW_ENTRANT_HIGH() {
    return '\u25B4'.green
  }

  static get NEW_ENTRANT_LOW() {
    return '\u25Be'.red
  }

  static get TOP() {
    return 'BEST'
  }

  static get BOTTOM() {
    return 'WORST'
  }

  constructor(store, type = UtilizationTopBottomReport.TOP) {
    this.store = store
    this.type = type
    this.leaderboard = []
    this.rh = new ReportHelper(`${type} MONTHLY PERFORMENCES`, this.store.date)
    this.position = 0
    this.burnoutAlert = false
    this.newEntrentAlert = false
    this.initialise()
  }

  initialise() {
    const { store } = this
    const model = this.type === UtilizationTopBottomReport.TOP ?
      store.top :
      store.bottom

    model.forEach((record) => {
      this.leaderboard.push(this.format(record))
    })
  }

  greenPercent(v, p = 1, suffix = '%') {
    return (this.percent(v, p, suffix))
      .green
  }

  redPercent(v, p = 1, suffix = '%') {
    return (this.percent(v, p, suffix))
      .red
  }

  percent(v, p = 1, suffix = '%') {
    return (v * 100)
      .toFixed(p) + suffix
  }

  format(record) {
    const dh = new DateHelper(new Date(record.date))
    const pad = (`${this.position + 1}`).length < 2 ? ' ' : ''
    const score = this.type === UtilizationTopBottomReport.TOP ?
      this.greenPercent(record.total) :
      this.redPercent(record.total)
    this.position += 1
    const nameStr = `# ${this.position} . ${pad}${record.name}`
    let str = `${nameStr.bold}  \t${score}\t${dh.monthYear}`

    if (dh.isNew) {
      str += ` ${this.newEntrentSymbole()}`
      this.newEntrentAlert = true
    }

    if (record.total > 0.75) {
      str += ` ${UtilizationTopBottomReport.BURNOUT_FLAG}`
      this.burnoutAlert = true
    }

    return str
  }

  newEntrentSymbole() {
    return this.type === UtilizationTopBottomReport.TOP ?
      UtilizationTopBottomReport.NEW_ENTRANT_HIGH :
      UtilizationTopBottomReport.NEW_ENTRANT_LOW
  }

  report() {
    this.rh.addReportTitle()
    const qualifier = this.type === UtilizationTopBottomReport.TOP ?
      ' best '.green :
      ' worst '.red

    this.rh.addSubtitle(`Top ${this.leaderboard.length} ${qualifier} monthly performances`.grey.italic)
    this.leaderboard.forEach((leader) => {
      console.log(leader);
    })

    if (this.burnoutAlert) {
      console.log('\n%s %s',
        UtilizationTopBottomReport.BURNOUT_FLAG,
        'Too high utilization may burnout Amazonians'.grey.italic)
    }

    if (this.newEntrentAlert) {
      const newline = this.burnoutAlert ? '' : '\n'
      console.log('%s%s', newline, this.newEntrentSymbole(), 'New leaderboard entry'.grey.italic)
    }
  }
}
