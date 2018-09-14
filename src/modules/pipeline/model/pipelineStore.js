import { DateHelper } from 'ika-helpers'

import PipelineRecord from './pipelineRecord'
import PipelineParser from './pipelineParser'

export default class PipelineStore {
  static get STORE_KEY() {
    return 'PipelineStore'
  }

  constructor(practiceManager) {
    this.pm = practiceManager
    this.store = []
    this.stages = [
      'Technical Validation',
      'Business Validation',
      'Committed'
    ]
  }

  initialise(data) {
    let pipeRecords = []

    if (data === null || !data) {
      console.log('[MP] WARNING: Initialization is not defined'.yellow);
    } else if (!data._store) {
      console.log('[MP] WARNING: Initialization data does not include _store records'.yellow)
    } else {
      pipeRecords = data._store
    }

    this.dataRefreshDate = data.dataRefreshDate

    this.store = pipeRecords.map(pr => new PipelineRecord([
      pr._practice,
      pr._closeDate,
      pr._customer,
      pr._opportunity,
      pr._forecast,
      pr._value,
      pr._ir,
      pr._ai,
      pr._duration,
      pr._probablity,
      pr._owner,
      pr._stage,
      pr._pa
    ]))
  }

  set store(store) {
    this._store = store
  }

  get store() {
    return this._store
  }

  get storeKey() {
    return PipelineStore.STORE_KEY
  }

  get size() {
    return this.store.length
  }

  get names() {
    return this._names
  }

  build(names, date) {
    if (names) {
      this._names = names
    }
    if (date) {
      this._date = date
    }

    if (this.store.length === 0) {
      // nothing to build
      return
    }

    this.setupMonths()
    // Scan and see what is the min and max pipe months

    this.monthly = this.rollupStages()
    // Build the base monthly pipeline data

    this.buildMonthlyRollups()
    // Per month per stage, calculates rollups for Total, AI and PA

    this.buildTotals()
    // Add totals to the monthly model (i.e. total pipe by stage).
    // This also rolls up the various stats like PA and AI

    this.buildMonthlyRatios()
    // Building the monthly pipe in respect to total pipe value
  }

  rollupStages() {
    const model = []
    this.names.forEach((name) => {
      const practice = { practice: name, months: [] }
      this.months.forEach((m) => {
        const mp = { month: m.month, isPast: m.isPast }
        this.stages.forEach((s) => {
          mp[s] = this.stats(this.pm.getAreaPractices(name), m.month, s)
        })
        practice.months.push(mp)
      })
      model.push(practice)
    })
    return model
  }

  buildMonthlyRollups() {
    this.monthly.forEach((p) => {
      p.months.forEach((m) => {
        const rollups = this.rollup([m])
        m.Total = rollups.t
        m.Total.pa = rollups.pa
        m.Total.ai = rollups.ai
      })
    })
  }

  buildTotals() {
    this.monthly.forEach((p) => {
      const pt = { month: -1, isPast: false }
      this.stages.forEach((s) => {
        pt[s] = { value: 0, count: 0, avg: 0 }
        p.months.forEach((m) => {
          pt[s].value = this.add(pt[s].value, m[s].value)
          pt[s].count += m[s].count
        })
      })
      const rollups = this.rollup(p.months)
      pt.Total = rollups.t
      pt.Total.pa = rollups.pa
      pt.Total.ai = rollups.ai

      p.months.push(pt)
    })
  }

  buildMonthlyRatios() {
    this.monthly.forEach((p) => {
      const total = this.getPipe(p.practice, -1, 'Total')
      p.months.forEach((m) => {
        m.monthlyVsTotal = this.divide(m.Total.value, total)
      })
    })
  }

  /**
   * For a list of motnhs [ms], caluclates the stats and total.
   * Month == -1 is skipped
   *
   * @param {Array} [ms=[]] List of months
   *
   * @return {Object} Stats object that includes pa, ai and t (total) properties
   */
  rollup(ms = []) {
    const pa = { count: 0, vsCount: 0 }
    const ai = {
      value: 0,
      count: 0,
      avg: 0,
      vsValue: 0,
      vsCount: 0
    }
    const t = { value: 0, count: 0, avg: 0 }

    ms.forEach((m) => {
      if (m.month === -1) { return } // we should not rollup the last month
      this.stages.forEach((s) => {
        pa.count += m[s].pa.count
        ai.value = this.add(ai.value, m[s].ai.value)
        ai.count += m[s].ai.count
        t.value = this.add(t.value, m[s].value)
        t.count += m[s].count
      })
    })

    pa.vsCount = this.divide(pa.count, t.count)
    ai.avg = this.divide(ai.value, ai.count)
    ai.vsValue = this.divide(ai.value, t.value)
    ai.vsCount = this.divide(ai.count, t.count)
    t.avg = this.divide(t.value, t.count)

    return { pa, ai, t }
  }

  get total() {
    return this.getPipe('APJ', -1, 'Total')
  }

  getPipe(practice, month, stage) {
    const data = this.getMonthData(this.getPracticeData(practice), month)
    return data ? data[stage].value : 0
  }

  getPracticeData(practiceName) {
    const data = this.monthly.find(p => p.practice === practiceName)
    return !data ? {} : data
  }

  getMonthData(practiceData, month) {
    return practiceData.months.find(m => m.month === month)
  }

  reconcile(data) {
    const parser = new PipelineParser(data)
    const newData = parser.parse()

    let removedOpts = 0
    this.store.forEach((p) => {
      if (!this.isIncluded(p, newData)) {
        removedOpts += 1
        console.log('%s %s \t%s', '-'.red, p.practice.grey, p.opportunity.red)
      }
    })

    let newOpts = 0
    newData.forEach((p) => {
      if (!this.isIncluded(p, this.store)) {
        newOpts += 1
        console.log('%s %s \t%s', '+'.green, p.practice.grey, p.opportunity.green)
      }
    })

    console.log('+%s opportunities'.green, newOpts);
    console.log('-%s opportunities'.red, removedOpts);
    console.log('%s Total opportunities', newData.length);

    this.dataRefreshDate = parser.date
    this.store = newData
    this.build()
  }

  isIncluded(record, list) {
    return list.filter(r => r.customer === record.customer &&
        r.opportunity === record.opportunity)
      .length > 0
  }

  setupMonths() {
    const { minDate, maxDate } = DateHelper.getMinMaxDates(this.store, '_closeDate')
    const minD = new DateHelper(minDate)

    this.minDate = minDate
    this.maxDate = maxDate

    this.months = []

    if (this.minDate !== null && this.maxDate !== null) {
      for (let m = this.minDate.getMonth(); m <= this.maxDate.getMonth(); m += 1) {
        this.months.push({ month: m, isPast: minD.isPast(m) })
      }
    }
  }

  add(a, b) {
    return this.fixed(a + b)
  }

  divide(x, y) {
    return (x / (y === 0 ? 1 : y)).toFixed(3)
  }

  fixed(num) {
    return num.toFixed(2) * 1
  }

  stats(practices, month, stage) {
    const pipe = this.store.filter(p => practices.includes(p.practice) &&
      p.closeDate.getMonth() === month &&
      p.stage === stage)

    const value = this.sum(pipe, '_value')
    const count = pipe.length
    const avg = this.divide(value, count)
    // Stage top line stats

    const pa = this.statsPa(pipe, count)
    const ai = this.statsAi(pipe, value, count)
    // Stage extra stats

    return {
      value,
      count,
      avg,
      pa,
      ai
    }
  }

  statsPa(pipe, count) {
    const pa = this.countIf(pipe, '_pa', i => i)
    return {
      count: pa,
      vsCount: (pa / (count === 0 ? 1 : count)).toFixed(3) * 1
    }
  }

  statsAi(pipe, value, count) {
    const ai = {
      value: 0,
      count: 0,
      avg: 0,
      vsCount: 0,
      vsValue: 0
    }

    pipe.forEach((p) => {
      if (p.ai > 0) {
        ai.value += p.ai
        ai.count += 1
      }
    })

    ai.avg = this.divide(ai.value, ai.count)
    ai.vsCount = this.divide(ai.count, count)
    ai.vsValue = this.divide(ai.value, value)

    return ai
  }

  sum(list, property) {
    let sum = 0
    list.forEach((item) => {
      sum += item[property]
    })
    return sum.toFixed(2) * 1
  }

  countIf(list, property, evaluator) {
    let count = 0
    list.forEach((item) => {
      if (evaluator(item[property])) {
        count += 1
      }
    })
    return count
  }
}
