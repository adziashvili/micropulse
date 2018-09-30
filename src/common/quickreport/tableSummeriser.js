import {
  StringBuffer,
  MathHelper,
  StringHelper as SH
} from 'ika-helpers'

import { Analyzer } from 'ika-datamart'

export default class TableSummeriser {
  constructor({
    array = [],
    summeriseKey,
    byKey,
    padding = '',
    displayAs = 'number',
    title = undefined
  } = {}) {
    this.array = array
    this.summeriseKey = summeriseKey
    this.byKey = byKey
    this.padding = padding
    this.displayAs = displayAs
    this.title = title
  }

  report() {
    const {
      array,
      summeriseKey,
      byKey,
      padding,
      displayAs,
      title
    } = this
    const distinct = []

    const byKeyValues = array.map(item => item[byKey])
    byKeyValues.forEach((v) => {
      if (!distinct.includes(v)) {
        distinct.push(v)
      }
    })
    distinct.sort()

    const type = Analyzer.guessType(array.map(item => item[summeriseKey]))
    const mode = ['number', 'currency'].includes(type) ? 'sum' : 'count'

    const totalValue = mode === 'count' ?
      array.length :
      array.reduce((sum, curr) => sum + curr[summeriseKey], 0)

    const summary = []
    distinct.forEach((dv) => {
      const item = {}
      const matching = this.array.filter(entry => entry[byKey] === dv)
      item.name = dv
      item.count = matching.length
      item.countRatio = MathHelper.devide(item.count, array.length)
      item.value = mode === 'count' ?
        item.count :
        matching.reduce((sum, curr) => sum + curr[summeriseKey], 0)
      item.displayValue = displayAs === 'currency' ?
        `$${SH.toThousands(item.value)}` : item.value
      item.ratio = MathHelper.devide(item.value, totalValue)
      summary.push(item)
    })

    console.log();
    const displayTitle = !title ? `${byKey} Summary` : title
    const msg = new StringBuffer(padding)
      .append(displayTitle.cyan)

    const maxLenName = Math.max(...summary.map(item => item.name.length))
    const maxLenValue = Math.max(...summary.map(item => item.displayValue.length))

    summary.forEach((item) => {
      msg
        .append('\n')
        .appendTimes(padding)
        .appendExact(item.name, maxLenName + 3)
        .appendExact(item.displayValue, maxLenValue)
        .append((` (${SH.prefix(SH.toPercent(item.ratio, 0), 3)})`).dim)
        .append(`\t${item.count}`)
        .append((` (${SH.toPercent(item.countRatio, 0)})`).dim)
    })
    console.log(msg.toString());
  }

  set array(arr = []) {
    if (!Array.isArray(this.array)) {
      this._array = []
    }
    this._array = arr
  }

  get array() {
    return this._array
  }
}
