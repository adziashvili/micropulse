import {
  Report,
  Dictionary,
  DateHelper,
  StringHelper,
  Analyzer,
  Customs
} from '../../common'

export default class BookingsPulse extends Report {
  constructor(pathToFile, storeManager) {
    super()
    this.file = pathToFile
    this.sm = storeManager
    this.setup()
  }

  setup() {
    const bookingsKey = 'Amount (converted)'
    this.firstColShrinkBy = 10
    this.otherColShrinBy = 4

    this.dictionary = new Dictionary([
      { key: 'TOTAL', shortName: 'APJ' },
      { key: 'Project: Practice', shortName: 'Practice' },
      { key: 'Effective Date', shortName: 'Date' },
      { key: 'Amount (converted)', shortName: 'Bookings' },
      { key: 'Project: Discount Percentage', shortName: 'Discount' },
      { key: 'Project: Discount Reason', shortName: 'Discount Reason' },
      { key: 'Project: Partner Account', shortName: 'Partner' }
    ])

    this.cols = [{
      key: 'Effective Date',
      transform: d => DateHelper.getMonthYear(d, true)
    }]
    // Defines the report to be based on effective date's month

    this.rows = [{
      key: 'Project: Practice',
      rollup: this.sm.pm.rollupAPAC,
      sortby: this.sm.pm.noAPJandSharedOrder
    }]
    // Defines one grouping by practice with rollup for APAC

    this.stats = [{ key: bookingsKey }]
    // Defines the main value we would like to showcase

    this.custom = [{
        key: 'Bookings YTD',
        isRowTransformer: true,
        isBreakLineBefore: true,
        transform: Customs.sumYTD(bookingsKey, true)
      },
      {
        key: 'Bookings TGT | FY',
        isRowTransformer: true,
        transform: (recs, modeler, series, key) => {
          if (series.length === 0) return []
          const { pm } = this.sm
          return pm.getAnnualTargetsbyMonth(key, 'bookings', 2018, series.length - 2)
            .map((v) => {
              if (!v) return '-'
              return `$${StringHelper.toThousands(v)}`
            })
        }
      },
      {
        key: 'Attainment',
        isRowTransformer: true,
        transform: (recs, modeler, series, key) => {
          if (series.length === 0) return []
          const { pm } = this.sm
          const targets = pm.getAnnualTargetsbyMonth(key, 'bookings', 2018, series.length - 2)
          const totals = Analyzer.sumArrays(series, bookingsKey)
          const actuals = Analyzer.mapToRollingSum(totals, true)

          return Analyzer.devideArrays(actuals, targets).map((v, i, values) => {
            if (!v) return ''.grey

            const percent = StringHelper.toPercent(v)
            if (i === values.length - 1) return percent.bold.black
            if (v >= 1.0) return percent.bold.bgGreen.white
            if (v >= 0.9) return percent.bold.bgGreen.white
            if (v >= 0.75) return percent.bold.bgYellow.white
            return percent.bold.bgRed.white
          })
        }
      },
      {
        key: 'Avergae Bookings Size',
        isRowTransformer: true,
        isBreakLineBefore: true,
        transform: (recs, modeler, series) => series.map(
          item => `$${StringHelper.toThousands(Analyzer.avgProperty(item, bookingsKey))}`
        )
      },
      {
        key: 'Engagements Count',
        transform: Customs.countPerColunm()
      },
      {
        key: 'Distribution vs. Self',
        isRowTransformer: true,
        isBreakLineBefore: true,
        isVerbose: true,
        transform: Customs.ratioSumVsSelfTotal(bookingsKey)
      },
      {
        key: 'Distribution vs. APJ',
        isRowTransformer: true,
        isVerbose: true,
        transform: Customs.ratioSumVsTotal(bookingsKey)
      }
    ]
    // Setting up custom analysis
  }
}
