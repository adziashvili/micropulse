import {
  Report,
  Dictionary,
  DateHelper,
  StringHelper,
  Analyzer,
  Customs
} from '../../common'

export default class PipelinePulseNew extends Report {
  constructor(file, storeManager) {
    super()
    this.file = file
    this.sm = storeManager
    this.setup()
  }

  getCountFunction() {
    return arr => arr.length
  }

  setup() {
    const amountKey = 'Total Contract Amount (converted)'

    this.dictionary = new Dictionary([
      { key: 'TOTAL', shortName: 'APJ' },
      { key: 'Practice', shortName: 'Practice' },
      { key: 'Close Date', shortName: 'Close Data' },
      { key: 'Account Name', shortName: 'Account' },
      { key: 'Opportunity Name', shortName: 'Opportunity' },
      { key: 'Forecast Status', shortName: 'Forecast' },
      { key: 'Total Contract Amount (converted)', shortName: 'Amount' },
      { key: 'Influenced Revenue (converted)', shortName: 'Influenced Revenue' },
      { key: 'Adoption Incentive Amount (converted)', shortName: 'Adoption Incentive' },
      { key: 'Project Duration (mos)', shortName: 'Duration( m )' },
      { key: 'Probability (%)', shortName: 'Probability' },
      { key: 'Opportunity Owner', shortName: 'Owner' },
      { key: 'Stage', shortName: 'Stage' },
      { key: 'Is Partner Account Involved?', shortName: 'Partner Attached' }
    ])

    this.cols = [{
        key: 'Close Date',
        transform: d => DateHelper.getMonthName(d.getMonth())
      }]

      this.rows = [{
          key: 'Practice',
          rollup: this.sm.pm.rollupAPAC,
          sortby: this.sm.pm.noAPJandSharedOrder
        },
        { key: 'Stage' }
      ]

      // Stats settings can inlcude the key to indicate which stat we would like to show case
      this.stats = [
        { key: 'Total Contract Amount (converted)' },
        { key: 'Project Duration (mos)' },
        { key: 'Is Partner Account Involved?' },
        { key: 'Close Date' }
      ]

      // We can pass a transformer to caluclate values or to caluclate the entire row.
      // Add isRowTransformer: true for row
      this.custom = [{
          key: 'Avergae Deal Size',
          isRowTransformer: true,
          isBreakLineBefore: true,
          transform: (recs, modeler, series) => series.map(item => (
            `$${StringHelper.toThousands(Analyzer.avgProperty(item, amountKey))}`))
        },
        {
          key: 'Opportunities Count',
          transform: Customs.countPerColunm()
        },
        {
          key: 'Pipe Distribution',
          isRowTransformer: true,
          isBreakLineBefore: true,
          isVerbose: true,
          transform: Customs.ratioSumVsSelfTotal(amountKey)
        },
        {
          key: 'vs. APJ',
          isRowTransformer: true,
          isVerbose: true,
          transform: Customs.ratioSumVsTotal(amountKey)
        }
      ]
    }
  }
