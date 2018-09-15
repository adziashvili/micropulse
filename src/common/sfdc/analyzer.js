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

  /**
   * Tests that all array elements are strings (typeof value === string)
   *
   * @param {Array} data Elemtns to test
   *
   * @return {Boolean} True if all are strings.
   */
  static isString(data) {
    return !data.some(d => !(typeof d === 'string'))
  }

  /**
   * Tests that all values are currencies.
   *
   * Currency currently is detected by a prefix of 'USD '
   *
   * @param {Array]} data Array of values to test
   *
   * @return {Boolean} True if all values start with 'USD '
   */
  static isCurrency(data) {
    const sizeOfDashOrNull = data.filter(d => Statistics.ZERO_VALUES.includes(d)).length
    if (sizeOfDashOrNull === data.length) {
      return false
    }
    return !data.filter(d => !Statistics.ZERO_VALUES.includes(d))
      .some(d => !(typeof d === 'string' && d.toLowerCase().trim().startsWith('usd ')))
  }

  /**
   * Tests if an array of values includes all numbers.
   *
   * @param {Array} data Array of data
   *
   * @return {Boolean} true if all values are numbers. Otherwise false.
   */
  static isNumber(data) {
    const sizeOfDashOrNull = data.filter(d => Statistics.ZERO_VALUES.includes(d)).length
    if (sizeOfDashOrNull === data.length) {
      return false
    }
    return !data.filter(d => !Statistics.ZERO_VALUES.includes(d))
      .some(d => typeof d !== 'number')
  }

  /**
   * Warning: Very naive test for percentage.
   *
   * Tests an array of values to see if all values are pecentages.
   *
   * @param {Array} data Array of data.
   *
   * @return {Boolean} True if all values start with %.
   */
  static isPercent(data) {
    return !data.some(d => !d.toLowerCase().endsWith('%'))
  }

  /**
   * Tests if an array of objects is an array of dates.
   *
   * @param {Array} data Array of objects or string representing a valid date.
   *
   * @return {Boolean} True if all array elemnts pass the following tests:
   *                   Date.parse(value) returns a valid miliseconds.
   *                   new Date (miliseconds) is an actual date.
   */
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

  /**
   * Tests if all values of an array can be evalued to boolean.
   * Tests includes yes, no, true, flase, 0 and 1
   *
   * @param {Array} data Array of values
   *
   * @return {Boolean} True if all values can be evaluetd to boolean
   */
  static isBoolean(data) {
    return !data.some((d) => {
      if (typeof d === 'boolean') {
        return false
      }
      if (typeof d === 'string') {
        return !(['1', '0', 'yes', 'no', 'true', 'false'].includes(d.toLowerCase()))
      }
      if (typeof d === 'number') {
        return !(d === 0 || d === 1)
      }
      return true
    })
  }
}
