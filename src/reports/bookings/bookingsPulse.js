import { Dictionary } from 'ika-datamart'

import {
  DateHelper,
  StringHelper,
  ReportHelper,
  MathHelper
} from 'ika-helpers'

import {
  Report,
  Customs
} from '../../common'

const BOOKINGS_DICTIONARY_DATA = [
  { key: 'TOTAL', shortName: 'APJ' },
  { key: 'Project: Practice Name', shortName: 'Practice' },
  { key: 'Effective Date', shortName: 'Date' },
  { key: 'Amount (converted)', shortName: 'Bookings' },
  { key: 'Project: Discount Percentage', shortName: 'Discount' },
  { key: 'Project: Discount Reason', shortName: 'Discount Reason' },
  { key: 'Project: Partner Account', shortName: 'Partner' }
]

// const TOP_10_LIST_CONFIG = {
//   title: 'TOP 10 Bookings YTD',
//   filterBeforeSort: undefined,
//   sortBy: (ra, rb) => rb['Amount (converted)'] - ra['Amount (converted)'],
//   filterAfterSort: (r, i) => i < 10,
//   displayKeys: ['Effective Date', 'Amount (converted)']
// }

export default class BookingsPulse extends Report {
  constructor(pathToFile, practiceManager, pipelineConfig) {
    super({
      file: pathToFile,
      dictionary: new Dictionary(BOOKINGS_DICTIONARY_DATA),
      firstColShrinkBy: 14,
      otherColShrinBy: 5,
      isRepeatHeaders: true
      // listConfig: TOP_10_LIST_CONFIG
    })

    this.pm = practiceManager
    this.pipeline = this.setupPipeline(pipelineConfig)
    this.bookingsKey = 'Amount (converted)'
    this.setup()
  }

  setup() {
    this.cols = [{
      key: 'Effective Date',
      transform: d => DateHelper.getMonthName(d.getMonth())
    }]
    // Defines the report to be based on effective date's month

    this.rows = [{
      key: 'Project: Practice Name',
      rollup: this.pm.rollupAPAC,
      sortby: this.pm.noAPJandSharedOrder
    }]
    // Defines one grouping by practice with rollup for APAC

    this.stats = [{ key: this.bookingsKey }]
    // Defines the main value we would like to showcase

    this.custom = [{
        key: '$ Average Bookings Size',
        isRowTransformer: true,
        transform: (recs, modeler, series) => series.map((item) => {
          const avg = StringHelper.toThousands(MathHelper.avgProperty(item, this.bookingsKey))
          return `$${avg}`
        })
      },
      {
        key: '# Bookings Count',
        transform: Customs.countPerColunm()
      },
      {
        key: '$ Bookings YTD',
        isRowTransformer: true,
        isBreakLineBefore: true,
        transform: Customs.sumYTD(this.bookingsKey, true, true)
      },
      {
        key: '$ Bookings TGT | FY',
        isRowTransformer: true,
        transform: (recs, modeler, series, key) => {
          if (series.length === 0) return []
          return this.pm.getAnnualTargetsbyMonth(key, 'bookings', 2018, series.length - 2)
            .map((v) => {
              if (!v) return ''
              return `$${StringHelper.toThousands(v)}`
            })
        }
      },
      {
        key: '% Bookings YTD / TGT',
        isRowTransformer: true,
        transform: (recs, modeler, series, key) => {
          if (series.length === 0) return []
          const targets = this.pm.getAnnualTargetsbyMonth(key, 'bookings', 2018, series.length - 2)
          const totals = MathHelper.sumArrays(series, this.bookingsKey)
          const actuals = MathHelper.mapToRollingSum(totals, true)

          return MathHelper.devideArrays(actuals, targets).map((v) => {
            if (!v) return ''
            const percent = StringHelper.toPercent(v)
            const rh = new ReportHelper()
            return rh.addTrafficLights(v, percent, 0.9, 0.75).bold
          })
        }
      },
      {
        key: '$ Pipeline (upto EOQ)',
        isRowTransformer: true,
        isBreakLineBefore: true,
        transform: (recs, modeler, series, key) => series.map((s, i) => {
          if (i === series.length - 1) {
            return `$${StringHelper.toThousands(this.pipelineValue(key))}`
          }
          if (i === series.length - 2) {
            const nextQMonthIndex = this.pm.getTargetIndex(i)
            return `$${StringHelper.toThousands(this.pipelineValue(key, nextQMonthIndex))}`
          }
          return ''
        })
      },
      {
        key: '$ Bookings Gap',
        isRowTransformer: true,
        transform: (recs, modeler, series, key) => {
          if (series.length === 0) return []
          const includeIndexes = [series.length - 1, series.length - 2]

          return this.bookingsGaps(key, series).map((v, i) => {
            if (!v || ((i + 1) % 3 !== 0 && !includeIndexes.includes(i))) {
              return ''
            }
            if (v >= 0) return `$${StringHelper.toThousands(v)}`.green.bold
            return `$${StringHelper.toThousands(Math.abs(v))}`.red.bold
          })
        }
      },
      {
        key: '% Pipline / Gap',
        isRowTransformer: true,
        transform: (recs, modeler, series, key) => {
          if (series.length === 0) return []
          const includeIndexes = [series.length - 1, series.length - 2]

          return this.bookingsGaps(key, series).map((v, i) => {
            if (!includeIndexes.includes(i)) {
              return ''
            }
            const pipeline = i === series.length - 1 ?
              this.pipelineValue(key) :
              this.pipelineValue(key, this.pm.getTargetIndex(i))

            const ratio = MathHelper.devide(pipeline, Math.abs(v))
            const rh = new ReportHelper()
            const colored = rh.addTrafficLights(ratio, `${ratio}`, 2.5, 2)
            return `${colored}x`.bold
          })
        }
      },
      {
        key: 'Distribution vs. Self',
        isRowTransformer: true,
        isBreakLineBefore: true,
        isVerbose: true,
        transform: Customs.ratioSumVsSelfTotal(this.bookingsKey)
      },
      {
        key: 'Distribution vs. APJ',
        isRowTransformer: true,
        isVerbose: true,
        transform: Customs.ratioSumVsTotal(this.bookingsKey)
      }
    ]
    // Setting up custom analysis
  }

  pipelineValue(key, monthIndex = 11) {
    const pipeline = this.pipeline.find(p => p.key === this.dictionary.get(key))
    return !pipeline ? undefined : pipeline.ytd[monthIndex]
  }

  bookingsGaps(key, series) {
    if (series.length === 0) return []
    const targets = this.pm.getAnnualTargetsbyMonth(key, 'bookings', 2018, series.length - 2)
    const totals = MathHelper.sumArrays(series, this.bookingsKey)
    const actuals = MathHelper.mapToRollingSum(totals, true)
    return MathHelper.subtractArrays(actuals, targets)
  }

  setupPipeline(pipelineConfig) {
    if (!pipelineConfig || !pipelineConfig.result || !pipelineConfig.result.summary) return []
    const pipeline = pipelineConfig.result.summary

    return pipeline.map((item) => {
      const key = item[0]
      const total = StringHelper.toNumberFromAmount(item[item.length - 1], 1000)

      const monthly = item.slice(1, item.length - 1)
      while (monthly.length < 12) {
        monthly.unshift(0)
      }

      const ytd = MathHelper.mapToRollingSum(
        monthly.map(m => StringHelper.toNumberFromAmount(m, 1000))
      )

      return { key, total, ytd }
    })
  }
}
