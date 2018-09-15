import { Statistics } from 'ika-helpers'

let ST

export default class Analyzer {
  static guessType(data = []) {
    let type = 'string'

    if (Analyzer.isNumber(data)) {
      type = 'number'
    } else if (Analyzer.isCurrency(data)) {
      type = 'currency'
    } else if (Analyzer.isDate(data)) {
      type = 'date'
    } else if (Analyzer.isBoolean(data)) {
      type = 'boolean'
    } else if (Analyzer.isString(data)) {
      type = 'string'
    }
    return type
  }

  static analyze(type, values) {
    if (!ST) {
      ST = new Statistics()
    }

    switch (type) {
      case 'number':
      case 'currency':
      case 'percent':
        return ST.numbers(values)
      case 'date':
        return ST.dates(values)
      case 'boolean':
        return ST.booleans(values)
      default:
        return ST.strings(values)
    }
  }

  static isString(data) {
    return !data.some(d => !(typeof d === 'string'))
  }

  static isCurrency(data) {
    const sizeOfDashOrNull = data.filter(d => Statistics.ZERO_VALUES.includes(d)).length

    if (sizeOfDashOrNull === data.length) {
      return false
    }

    return !data.filter(d => !Statistics.ZERO_VALUES.includes(d))
      .some(d => !(typeof d === 'string' && d.toLowerCase().trim().startsWith('usd ')))
  }

  static isNumber(data) {
    const sizeOfDashOrNull = data.filter(d => Statistics.ZERO_VALUES.includes(d)).length

    if (sizeOfDashOrNull === data.length) {
      return false
    }

    return !data.filter(d => !Statistics.ZERO_VALUES.includes(d))
      .some(d => typeof d !== 'number')
  }

  static isPercent(data) {
    return !data.some(d => !d.toLowerCase().endsWith('%'))
  }

  static isDate(data) {
    return !data.some((d) => {
      const ms = Date.parse(d)
      if (isNaN(ms)) {
        return true
      }
      const date = new Date(ms)
      if (date.getMonth === undefined) {
        return true
      }
      return false
    })
  }

  static isBoolean(data) {
    return !data.some((d) => {
      if (typeof d === 'boolean') {
        return false
      }
      if (typeof d === 'string') {
        return !(['yes', 'no', 'true', 'false'].includes(d.toLowerCase()))
      }
      if (typeof d === 'number') {
        return !(d === 0 || d === 1)
      }
      return true
    })
  }
}
