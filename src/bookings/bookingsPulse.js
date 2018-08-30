import {
  Report,
  Dictionary,
  DateHelper,
  StringHelper,
  Analyzer
} from '../common'

export default class BookingsPulse extends Report {
  constructor(pathToFile, storeManager) {
    super()
    this.file = pathToFile
    this.sm = storeManager
    this.setup()
  }

  setup() {
    const bookingsKey = 'Amount (converted)'

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
      rollup: { values: ['ANZ', 'ASEAN', 'S.KOREA'], key: 'APAC' }
    }]
    // Defines one grouping by practice with rollup for APAC

    this.stats = [{ key: bookingsKey }]
    // Defines the main value we would like to showcase

    this.custom = [{
        key: 'Bookings YTD',
        isRowTransformer: true,
        transform: (recs, modeler, series) => {
          if (series.length === 0) return []
          const totals = series.map((item) => {
            if (item.length === 0) {
              return 0
            }
            return item.reduce((sum, s) => sum + s[bookingsKey], 0)
          })

          const actuals = Analyzer.mapToRollingSum(totals, true)

          return actuals.map((v) => {
            if (!v) return '-'
            return StringHelper.toThousands(v)
          })
        }
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
              return StringHelper.toThousands(v)
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
          const totals = series.map((item) => {
            if (item.length === 0) {
              return 0
            }
            return item.reduce((sum, s) => sum + s[bookingsKey], 0)
          })

          const actuals = Analyzer.mapToRollingSum(totals, true)

          return Analyzer.devideArrays(actuals, targets).map((v) => {
            if (!v) return '-'
            return StringHelper.toPercent(v)
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
        transform: recs => recs.length
      },
      {
        key: 'Distribution vs. Self',
        isRowTransformer: true,
        isBreakLineBefore: true,
        transform: (recs, modeler, series) => {
          const totals = series.map((item) => {
            if (item.length === 0) return 0
            return item.reduce((sum, s) => sum + s[bookingsKey],
              0)
          })
          // This gives us the total of bookings across the cols we have

          const allTotal = totals.length > 0 ? totals[totals.length - 1] : 0
          // the last record includes all records, so its sum is the TOTAL for all

          return totals.map(total => StringHelper.toPercent(Analyzer.devide(total, allTotal)))
        }
      },
      {
        key: 'Distribution vs. APJ',
        isRowTransformer: true,
        transform: (recs, modeler, series) => {
          const totals = series.map((item) => {
            if (item.length === 0) {
              return 0
            }
            return item.reduce((sum, s) => sum + s[bookingsKey], 0)
          })
          // This gives us the total of bookings across the cols we have

          const allTotal = Analyzer.sumProperty(modeler.model.records, bookingsKey)
          // This is precalculated and should give us the sum of all records

          return totals.map(total => StringHelper.toPercent(Analyzer.devide(total, allTotal)))
        }
      }
    ]
    // Setting up custom analysis
  }
}
