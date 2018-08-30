import { Parser } from '..'

const DICTIONARY = [
  { key: 'countTotal', shortName: 'Count' },
  { key: 'countDistinct', shortName: 'Count (distinct)' },
  { key: 'countNonEmpty', shortName: 'Count (non empty)' },
  { key: 'sum', shortName: 'Sum', isTypeSensitive: true },
  { key: 'avg', shortName: 'Average', isTypeSensitive: true },
  { key: 'min', shortName: 'Minimum', isTypeSensitive: true },
  { key: 'max', shortName: 'Maximum', isTypeSensitive: true },
  { key: 'avgNonEmpty', shortName: 'Average (non empty)', isTypeSensitive: true },
  { key: 'maxStringLength', shortName: 'Max characters' },
  { key: 'minStringLength', shortName: 'Min characters' }
]

const TYPE_SENSITIVE_STATS = DICTIONARY.map((m) => {
  if (!!m.isTypeSensitive && m.isTypeSensitive) {
    return m.key
  }
  return undefined
}).filter(item => !!item)

export default class Analyzer {
  static dictionary() {
    return DICTIONARY
  }

  static typeSensitiveStats() {
    return TYPE_SENSITIVE_STATS
  }

  static analyzeType(data = []) {
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
    switch (type) {
      case 'number':
      case 'currency':
      case 'percent':
        return Analyzer.numbers(values)
      case 'date':
        return Analyzer.dates(values)
      case 'boolean':
        return Analyzer.booleans(values)
      default:
        return Analyzer.strings(values)
    }
  }

  static getDefaultStatKey(type) {
    switch (type) {
      case 'number':
      case 'currency':
      case 'percent':
        return 'sum'
      case 'string':
      case 'boolean':
      case 'date':
      default:
        return 'countTotal'
    }
  }

  static numbers(values) {
    const tmpValues = values.map((v) => {
      if (Parser.ZERO_OR_MISSING.includes(v)) {
        return 0
      }
      return v
    })
    const stats = Analyzer.strings(tmpValues)
    Object.assign(stats, Analyzer.numerics(tmpValues))
    return stats
  }

  static dates(values) {
    const vNums = values.map(v => v.valueOf())
    const stats = Analyzer.numbers(vNums)

    delete stats.sum
    delete stats.avg
    delete stats.avgNonEmpty

    stats.min = new Date(stats.min)
    stats.max = new Date(stats.max)

    return stats
  }

  static booleans(values) {
    const bNums = values.map((v) => {
      if (Parser.ZERO_OR_MISSING.includes(v)) {
        return 0
      }
      return v * 1
    })

    return Analyzer.numbers(bNums)
  }

  static strings(values) {
    const stats = {}
    stats.countTotal = values.length
    stats.countDistinct = Analyzer.distinct(values).count
    stats.countNonEmpty = Analyzer.nonEmpty(values).count
    const lengths = values.map(v => `${v}`.length)
    stats.maxStringLength = Math.max(...lengths)
    stats.minStringLength = Math.min(...lengths)
    return stats
  }

  static numerics(values) {
    let sum = 0
    let avg = 0
    let avgNonEmpty = 0
    let min = values[0]
    let max = values[0]
    const nonEmpty = Analyzer.nonEmpty(values)

    values.forEach((v) => {
      sum += v
      min = v < min ? v : min
      max = v > min ? v : max
    })

    avg = Analyzer.devide(sum, values.length)
    avgNonEmpty = Analyzer.devide(sum, nonEmpty.count)

    return {
      sum: sum.toFixed(2),
      avg,
      avgNonEmpty,
      min,
      max
    }
  }

  static isString(data) {
    return !data.some(d => !(typeof d === 'string'))
  }

  static isCurrency(data) {
    const sizeOfDashOrNull = data.filter(d => Parser.ZERO_OR_MISSING.includes(d)).length

    if (sizeOfDashOrNull === data.length) {
      return false
    }

    return !data.filter(d => !Parser.ZERO_OR_MISSING.includes(d))
      .some(d => !(typeof d === 'string' && d.toLowerCase().trim().startsWith('usd ')))
  }

  static isNumber(data) {
    const sizeOfDashOrNull = data.filter(d => Parser.ZERO_OR_MISSING.includes(d)).length

    if (sizeOfDashOrNull === data.length) {
      return false
    }

    return !data.filter(d => !Parser.ZERO_OR_MISSING.includes(d))
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

  static devide(a, b, fixed = 2) {
    if (!b || b === 0) return b
    return (a / b).toFixed(fixed)
  }

  static devideArrays(a = [], b = []) {
    if (!Array.isArray(a) || !Array.isArray(b)) {
      return undefined
    }

    if (a.length !== b.length) {
      return undefined
    }

    const devisinResultArr = []
    a.forEach((v, i) => {
      const x = !v || Number.isNaN(v) ? 0 : v
      const y = Number.isNaN(b[i]) ? 0 : b[i]
      devisinResultArr.push(Analyzer.devide(x, y, 3))
    })
    return devisinResultArr
  }

  static mapToRollingSum(arrayOfNumbers, isLastValueTotal = false) {
    const values = []
    let sum = 0

    for (let i = 0; i < arrayOfNumbers.length; i += 1) {
      if (isLastValueTotal && i === arrayOfNumbers.length - 1) {
        values.push(sum)
      } else {
        sum += arrayOfNumbers[i]
        values.push(sum)
      }
    }

    return values
  }

  static distinct(values) {
    const distinct = []
    values.forEach((s) => {
      if (!distinct.includes(s)) { distinct.push(s) }
    })
    return { count: distinct.length, values: distinct }
  }

  static nonEmpty(values) {
    const nonEmpty = values.filter(v => ![0].concat(Parser.ZERO_OR_MISSING).includes(v))
    return {
      count: nonEmpty.length,
      values: nonEmpty
    }
  }

  static PoP(data = [], transform = null) {
    if (!data || !Array.isArray(data)) {
      console.log('WARNING: data passed to Analyzer.PoP must be an array. Received:', typeof data);
      return []
    }

    if ((!transform || transform === null) && !Analyzer.isNumber(data)) {
      console.log('WARNING: When trasnform is null or undefined data must numeric array.');
      return []
    }

    const values = transform ? data.map(item => transform(item)) : data
    const change = [0]

    values.forEach((v, i, valuesArray) => {
      if (i === 0) return
      change.push(((Analyzer.devide(v, valuesArray[i - 1], 4) * 1) - 1).toFixed(4) * 1)
    })

    return change
  }

  static sumArrays(arrayOArrays = [], property = '') {
    return arrayOArrays.map((array) => {
      if (array.length === 0) {
        return 0
      }
      return array.reduce((sum, s) => sum + s[property], 0)
    })
  }

  static sumProperty(arrayOfObjects = [], property = '') {
    if (!Array.isArray(arrayOfObjects) || arrayOfObjects.length === 0) {
      return 0
    }

    return arrayOfObjects.reduce((sum, obj) => sum + (Object.keys(obj).includes(property) ?
      obj[property] : 0
    ), 0)
  }

  static avgProperty(arrayOfObjects = [], property = '') {
    return Analyzer.devide(Analyzer.sumProperty(arrayOfObjects, property), arrayOfObjects.length) *
      1
  }

  static avg(values = []) {
    return Analyzer.devide(values.reduce((sum, v) => sum + v), values.length) * 1
  }
}
