import { Dictionary } from 'ika-datamart'

import {
  DateHelper,
  StringHelper,
  MathHelper
} from 'ika-helpers'

import {
  Report,
  Customs
} from '../../common'

const PIPELINE_DICTIONARY_DATA = [
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
]

const PRIME_KEY = 'Total Contract Amount (converted)'
const TOP_X = 10
const TOP_TITLE = `TOP ${TOP_X}`

const TOP_X_LIST_CONFIG = {
  title: `${TOP_TITLE} Opportunities`,
  filterBeforeSort: undefined,
  sortBy: (ra, rb) => rb[PRIME_KEY] - ra[PRIME_KEY],
  filterAfterSort: (r, i) => i < TOP_X,
  displayKeys: [PRIME_KEY, 'Close Date', 'Forecast Status', 'Account Name'],
  summerise: {
    summeriseKey: PRIME_KEY,
    byKey: 'Forecast Status',
    displayAs: 'currency',
    title: `${TOP_TITLE} Forecast Status`
  }
}

export default class PipelinePulse extends Report {
  constructor(file, practiceManager) {
    super({
      file,
      dictionary: new Dictionary(PIPELINE_DICTIONARY_DATA),
      isRepeatHeaders: true,
      listConfig: TOP_X_LIST_CONFIG
    })

    this.pm = practiceManager
    this.amountKey = 'Total Contract Amount (converted)'
    this.setup()
  }

  setup() {
    this.cols = [{
      key: 'Close Date',
      transform: d => DateHelper.getMonthName(d.getMonth())
    }]

    this.rows = [{
        key: 'Practice',
        rollup: this.pm.rollupAPAC,
        sortby: this.pm.noAPJandSharedOrder
      },
      { key: 'Stage' }
      // {
      //   key: 'Forecast Status',
      //   sortby: ['In Forecast', 'In Forecast At Risk', 'Strong Upside', 'Upside', '-']
      // }
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
        key: '$ Average Deal Size',
        isRowTransformer: true,
        isBreakLineBefore: true,
        transform: (recs, modeler, series) => series.map(item => (
          `$${StringHelper.toThousands(MathHelper.avgProperty(item, this.amountKey))}`))
      },
      {
        key: '# Opportunities',
        transform: Customs.countPerColunm()
      },
      {
        key: '% Pipe Distribution',
        isRowTransformer: true,
        isBreakLineBefore: true,
        isVerbose: true,
        transform: Customs.ratioSumVsSelfTotal(this.amountKey)
      },
      {
        key: '% vs. APJ',
        isRowTransformer: true,
        isVerbose: true,
        transform: Customs.ratioSumVsTotal(this.amountKey)
      }
    ]
  }
}
