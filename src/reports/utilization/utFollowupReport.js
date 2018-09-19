import { Verbatim } from '../../common'

export default class UtFollowupReport {
  constructor(config = undefined, practiceManager = undefined) {
    let verbatimData = []
    if (config && config.result && config.result.verbatim) {
      verbatimData = config.result.verbatim
    }

    this.verbatim = new Verbatim(verbatimData)
    this.names = !practiceManager ? [] : practiceManager.all
    this.clean()
  }

  clean() {
    this.verbatim.transform((v) => {
      if (typeof v === 'string' && v.endsWith('%')) {
        return v.replace('%', '') * 1
        // removing the % sign if it is included
      }
      return v
    })
  }

  getYTDTotalUtilization(name) {
    return this.strip(this.verbatim.findAfter('% YTD Total', name))
  }

  getMonthlyTotalUtilization(name) {
    return this.strip(this.verbatim.findAfter('% MON Total', name))
  }

  getMonthlyBillableUtilization(name) {
    return this.strip(this.verbatim.findAfter('% MON Billable', name))
  }

  getMonthlyInvestmentUtilization(name) {
    return this.strip(this.verbatim.findAfter('% MON Investment', name))
  }

  getTimesAbove(values, threshhold) {
    return values.filter(v => v >= threshhold).length
  }

  /**
   * Removes the first (key) and last elements (total)
   *
   * @param {Array} values Array of values.
   *
   * @return {Array} Striped array. Unfefined if values is not an array
   */
  strip(values) {
    if (!values || !Array.isArray(values)) return undefined
    return values.slice(1, values.length - 1)
  }

  report(isVerbose = false) {
    console.log(`Hi I am UtFollowupReport(${isVerbose}) that was not subclassed.`);
    console.log('Without subclassing me, I log the data I got after some cleanup:');
    this.verbatim.log()
  }
}
