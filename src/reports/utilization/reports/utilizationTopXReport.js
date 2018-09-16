import { DateHelper, ReportHelper } from 'ika-helpers'
import UtFollowupReport from './utFollowupReport'

const BURNOUT_FLAG = '*'.red.italic
const NEW_ENTRANT = '\u25B4'.green
const BLACK_LIST = ['APJ', 'APAC', 'APJ Shared']

export default class UtilizationTopXReport extends UtFollowupReport {
  constructor(config = undefined, storeManager) {
    super(config, storeManager)

    this.leaderboard = []
    this.rh = new ReportHelper('LEADERBOARD: TOP MONTHLY PERFORMENCES')
    this.position = 0
    this.burnoutAlert = false
    this.newEntrentAlert = false

    this._build()
  }

  _build() {
    const topCount = 10
    let tmp = this._spread()
    // spread all totals and sort

    tmp = tmp.filter(item => !BLACK_LIST.includes(item.name))
    // remove the aggregation entries

    tmp = tmp.slice(0, topCount)
    // take top 10

    tmp.forEach((record) => {
      this.leaderboard.push(this.format(record))
    })
  }

  report() {
    this.rh.addReportTitle()

    this.rh.addSubtitle(`Top ${this.leaderboard.length} ${' best '.green} monthly performances`.grey.italic)
    this.leaderboard.forEach((leader) => {
      console.log(leader);
    })

    if (this.burnoutAlert) {
      console.log('\n%s %s',
        BURNOUT_FLAG,
        'Too high utilization levels may burnout Amazonians'.grey.italic)
    }

    if (this.newEntrentAlert) {
      const newline = this.burnoutAlert ? '' : '\n'
      console.log('%s%s', newline, NEW_ENTRANT, 'New leaderboard entry'.grey.italic)
    }
  }

  _spread() {
    const list = []
    this.names.forEach((name) => {
      const monthlyTotals = this.getMonthlyTotalUtilization(name)
      monthlyTotals.forEach((total, monthIndex) => {
        list.push({
          name,
          total,
          monthIndex,
          type: 'MONTHLY'
        })
      })

      const ytdTotals = this.getYTDTotalUtilization(name)
      ytdTotals.forEach((total, monthIndex) => {
        list.push({
          name,
          total,
          monthIndex,
          type: 'YTD'
        })
      })
    })

    return list.sort((a, b) => b.total - a.total)
  }

  format(record) {
    const date = new Date(Date.now())
    date.setMonth(record.monthIndex)
    const dh = new DateHelper(date)

    const pad = (`${this.position + 1}`).length < 2 ? ' ' : ''
    const score = `${record.total.toFixed(1)}%`

    this.position += 1
    const nameStr = `# ${this.position} . ${pad}${record.name}`

    let str = `${nameStr.bold}  \t${score}\t${dh.monthYear}`

    if (dh.isNew) {
      str += ` ${NEW_ENTRANT}`
      this.newEntrentAlert = true
    }

    if (record.total > 75) {
      str += ` ${BURNOUT_FLAG}`
      this.burnoutAlert = true
    }

    return str
  }
}
