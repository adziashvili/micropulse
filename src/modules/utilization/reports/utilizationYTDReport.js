import { ReportHelper, StringHelper } from '../../../common'

const TGT_BILLABLE = 0.4
const TGT_INVESTMENT = 0.2
const TGT_TOTAL = (TGT_BILLABLE + TGT_INVESTMENT).toFixed(3) * 1
const YELLOW_THRESHOLD = 0.8

/**
 * Utilization Monthly report with YTD.
 *
 * This report also inclides Month over Month and 5,3,2 months averages
 */
export default class UtilizationYTDReport {
  /**
   * Constructor.
   *
   * @param {Object} store Utilization store.
   */
  constructor(store) {
    this.store = store
    this.reportName = 'MONTHLY UTILIZATION | YTD'
    this.rh = new ReportHelper(this.reportName, store.date)
  }

  /**
   * Prints to stdout the utilization report.
   */
  report(isVerbose = false) {
    const deviderName = ['APAC', 'APJ']

    this.rh.addReportTitle()
    // print report title

    this.store.names.forEach((name) => {
      this.rh.addDevider(name, deviderName)
      // ---

      this.rh.addHeaderAsMonths(name)
      // print headers

      this.reportUtilization(
        this.store.monthly[name],
        this.store.ytd[name],
        'Billable'
      )

      this.reportUtilization(
        this.store.monthly[name],
        this.store.ytd[name],
        'Investment'
      )

      this.reportUtilization(
        this.store.monthly[name],
        this.store.ytd[name],
        'Total',
        'Monthly'
      )

      this.reportMom(
        this.store.monthly[name].MoM,
        'MoM'
      )

      console.log('')
      this.reportUtilization(
        this.store.ytd[name],
        this.store.ytd[name],
        'Total', 'YTD'
      )

      if (isVerbose) {
        this.reportMom(
          this.store.ytd[name].MoM,
          'MoM'
        )

        console.log('')

        this.reportAverages(
          this.store.monthly[name].MoM,
          this.store.ytd[name].MoM
        )

        console.log('')
      }
      // ---
      this.rh.addDevider(name, deviderName, true)
    })
    // report
  }

  /**
   * Adds a formated utilization row to stdout.
   *
   * @param {[type]} monthly Array of monthly utilization
   * @param {[type]} ytd     Array of YTD utilization
   * @param {[type]} type    Utilization type. Used for Traffic light coloring.
   *
   * @return {[type]} [description]
   */
  reportUtilization(series, ytd, type, inTitle) {
    const title = !inTitle ? type : inTitle
    const titlePrefix = `  ${title}`
    let uStr = `${(StringHelper.exact(titlePrefix, 12)).grey}\t`

    series[type].forEach((v) => {
      uStr += `${this.format(type, v)}\t`
    })

    uStr += `| ${this.format(type, ytd[type][ytd[type].length - 1])}`

    if (type === 'Total') {
      console.log('%s'.bold, uStr);
    } else {
      console.log(uStr);
    }
  }

  /**
   * Reports month over month utilization change.
   *
   * @param {String} name The name of the series.
   */
  reportMom(series, title) {
    const titlePrefix = `  ${title}`
    let uStr = `${(StringHelper.exact(titlePrefix, 12)).grey}\t`

    series.forEach((v) => {
      uStr += `${this.formatMom(v)}\t`
    })

    uStr += `| ${this.formatAverageMom(this.trailingAverage(series, 5))} On Avg.`.grey.italic

    console.log(uStr);
  }

  formatAverageMom(avg) {
    const formated = `${(avg * 100).toFixed(0)}%`.grey
    return this.rh.addChangeSymbol(avg, formated)
  }

  /**
   * Formats an MoM change (slightly different than a change)
   *
   * @param {Number} v value to format
   *
   * @return {String} Formated Mom string with symbol and padding.
   */
  formatMom(v) {
    if (v === 1) {
      return '  -  '.grey
    }
    if (v > 1) {
      return `${this.rh.UP} ${((v - 1) * 100).toFixed(v - 1 > 0.1 ? 0 : 1)}%`.grey
    }

    return `${this.rh.DOWN} ${((1 - v) * 100).toFixed(Math.abs(1 - v) > 0.1 ? 0 : 1)}%`.grey
  }

  /**
   * Prints averages for last 5,3 and 2 months for Monthly and YTD for a given TYPE of utilization
   *
   * @param {Array} monthly Array of monthly utilization
   * @param {Array} ytd Array of YTD utilziation
   */
  reportAverages(monthly, ytd) {
    let strPrefix = ''
    let iPrefix = 0

    while (iPrefix < (monthly.length - 5) + 1) {
      strPrefix += '\t'
      iPrefix += 1
    }

    console.log('%s4 months avg. change (motnhly | YTD):\t%s\t| %s'.grey,
      strPrefix,
      this.format('C', this.trailingAverage(monthly, 4), 0, false),
      this.format('C', this.trailingAverage(ytd, 4), 0, false))

    console.log('%s2 months avg. change (motnhly | YTD):\t%s\t| %s'.grey,
      strPrefix,
      this.format('C', this.trailingAverage(monthly, 2), 0, false),
      this.format('C', this.trailingAverage(ytd, 2), 0, false))
  }

  /**
   * Calculates the last periods average
   *
   * @param {[type]} series  Series of numbers
   * @param {[type]} periods Periods to go back for avg. calculation
   *
   * @return {Number} Average for values in series across the designated number of last periods.
   */
  trailingAverage(series, periods) {
    let count = periods
    let sum = 0
    const len = series.length

    while (count > 0) {
      sum += series[len - count] - 1
      count -= 1
    }

    return sum / periods
  }

  /**
   * Formats a number for display
   *
   * @param {[type]}  valueType   'Billable', 'Investment', 'Total', use any other for change formating
   * @param {[type]}  value       Number to format
   * @param {Number}  [digits=1]  Number of digits to display after the point (precision)
   * @param {Boolean} [bPad=true] If true 0 is added if the length of string is less than 5
   *
   * @return {[type]}  [description]
   */
  format(valueType, value, digits = 1, bPad = true) {
    let valueString = `${(Math.abs(value) * 100).toFixed(digits)}%`
    valueString = valueString.length < 5 && bPad ? `0${valueString}` : valueString

    switch (valueType) {
      case 'Billable':
        return this.rh.addTrafficLights(
          value,
          valueString,
          TGT_BILLABLE,
          YELLOW_THRESHOLD
        )
      case 'Investment':
        return this.rh.addTrafficLights(
          value,
          valueString,
          TGT_INVESTMENT,
          YELLOW_THRESHOLD
        )
      case 'Total':
        return this.rh.addTrafficLights(
          value,
          valueString,
          TGT_TOTAL,
          YELLOW_THRESHOLD
        )
      default:
        return this.rh.addChangeSymbol(
          value,
          this.rh.addChangeColor(value, valueString)
        )
    }
  }
}
