import {
  Report,
  Dictionary,
  DateHelper,
  StringHelper as SH,
  ReportHelper,
  MathHelper,
  Customs
} from '../../common'

const UTILIZATION_DICTIONARY_DATA = [
  { key: 'TOTAL', shortName: 'APJ' },
  { key: 'Resource: Practice', shortName: 'Practice' },
  { key: 'Resource: Full Name', shortName: 'Name' },
  { key: 'Historical End Date', shortName: 'End Date' },
  { key: 'Historical Calendar Hours', shortName: 'Calendar Hours' },
  { key: 'Historical Excluded Hours', shortName: 'Excluded Hours' },
  { key: 'Historical Billable Hours', shortName: 'Billable' },
  { key: 'Historical Credited Hours', shortName: 'Investment' }
]

export default class UtilizationPulseNew extends Report {
  constructor(file, storeManager) {
    super({
      file,
      dictionary: new Dictionary(UTILIZATION_DICTIONARY_DATA),
      firstColShrinkBy: 10,
      otherColShrinBy: 10,
      isRepeatHeaders: true
    })

    this.invKey = 'Historical Credited Hours'
    this.billKey = 'Historical Billable Hours'
    this.calKey = 'Historical Calendar Hours'
    this.exKey = 'Historical Excluded Hours'
    this.rh = new ReportHelper()

    this.sm = storeManager
    this.amountKey = 'Historical Billable Hours'
    this.setup()
  }

  setup() {
    this.cols = [{
      key: 'Historical End Date',
      transform: d => DateHelper.getMonthName(d.getMonth())
    }]

    this.rows = [{
      key: 'Resource: Practice',
      rollup: this.sm.pm.rollupAPAC,
      sortby: this.sm.pm.noAPJOrder
    }]

    this.custom = [{
        key: '% YTD Total',
        isRowTransformer: true,
        transform: (recs, modeler, series) => {
          const billYTD = Customs.sumYTD(this.billKey)(recs, modeler, series)
          const invYTD = Customs.sumYTD(this.invKey)(recs, modeler, series)
          const totalUtilYTD = billYTD.map((b, i) => b + invYTD[i])
          const totalYTD = this.totalHoursYTD(series)
          const result = MathHelper.devideArrays(totalUtilYTD, totalYTD)
          return result.map(m => this.rh.addTrafficLights(m, SH.toPercent(m), 0.6, 0.9).bold)
        }
      },
      {
        key: '% YTD Billable',
        isRowTransformer: true,
        transform: (recs, modeler, series) => {
          const billYTD = Customs.sumYTD(this.billKey)(recs, modeler, series)
          const totalYTD = this.totalHoursYTD(series)
          const result = MathHelper.devideArrays(billYTD, totalYTD)
          return result.map(m => this.rh.addTrafficLights(m, SH.toPercent(m), 0.4, 0.9))
        }
      },
      {
        key: '% YTD Investment',
        isRowTransformer: true,
        transform: (recs, modeler, series) => {
          const invYTD = Customs.sumYTD(this.invKey)(recs, modeler, series)
          const totalYTD = this.totalHoursYTD(series)
          const result = MathHelper.devideArrays(invYTD, totalYTD)
          return result.map(m => this.rh.addTrafficLights(m, SH.toPercent(m), 0.2, 0.9))
        }
      },
      {
        key: '% MON Total',
        isBreakLineBefore: true,
        isRowTransformer: true,
        transform: (recs, modeler, series) => {
          const total = this.totalMonthly(series)
          return total.map(m => this.rh.addTrafficLights(m, SH.toPercent(m), 0.6, 0.9).bold)
        }
      },
      {
        key: '% MON Billable',
        isRowTransformer: true,
        transform: (recs, modeler, series) => {
          const totalBilable = series.map(s => MathHelper.sumProperty(s, this.billKey))
          const totalHours = this.totalHours(series)
          const billable = MathHelper.devideArrays(totalBilable, totalHours)
          return billable.map(m => this.rh.addTrafficLights(m, SH.toPercent(m), 0.4, 0.9))
        }
      },
      {
        key: '% MON Investment',
        isRowTransformer: true,
        transform: (recs, modeler, series) => {
          const totalInv = series.map(s => MathHelper.sumProperty(s, this.invKey))
          const totalHours = this.totalHours(series)
          const investment = MathHelper.devideArrays(totalInv, totalHours)
          return investment.map(m => this.rh.addTrafficLights(m, SH.toPercent(m), 0.2, 0.9))
        }
      },
      {
        key: '% YTD MoM',
        isRowTransformer: true,
        isBreakLineBefore: true,
        transform: (recs, modeler, series) => {
          const totalUtilYTD = MathHelper.PoP(this.totalYTD(series))
          return totalUtilYTD.map(m => this.rh.addChangeSymbol(m, SH.toPercent(m)))
        }
      }, {
        key: '% MON MoM',
        isRowTransformer: true,
        transform: (recs, modeler, series) => {
          const mom = MathHelper.PoP(this.totalMonthly(series))
          return mom.map(m => this.rh.addChangeSymbol(m, SH.toPercent(m)))
        }
      }
    ]
  }

  totalMonthly(series) {
    const totalBilable = series.map(s => MathHelper.sumProperty(s, this.billKey))
    const totalInv = series.map(s => MathHelper.sumProperty(s, this.invKey))
    const totalUtilized = totalBilable.map((m, i) => m + totalInv[i])
    const totalHours = this.totalHours(series)
    return MathHelper.devideArrays(totalUtilized, totalHours)
  }

  totalYTD(series) {
    const billYTD = Customs.sumYTD(this.billKey)(undefined, undefined, series)
    const invYTD = Customs.sumYTD(this.invKey)(undefined, undefined, series)
    const totalUtilYTD = billYTD.map((b, i) => b + invYTD[i])
    const totalYTD = this.totalHoursYTD(series)
    return MathHelper.devideArrays(totalUtilYTD, totalYTD)
  }

  totalHoursYTD(series) {
    const calYTD = Customs.sumYTD(this.calKey)({}, {}, series)
    const excYTD = Customs.sumYTD(this.exKey)({}, {}, series)
    return calYTD.map((c, i) => c - excYTD[i])
  }

  totalHours(series) {
    const calendarHours = series.map(s => MathHelper.sumProperty(s, this.calKey))
    const excludedHours = series.map(s => MathHelper.sumProperty(s, this.exKey))
    return calendarHours.map((m, i) => m - excludedHours[i])
  }
}
