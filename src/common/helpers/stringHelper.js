const assert = require('assert')

export default class StringHelper {
  /**
   * Default suffic: '...'
   *
   * @type {String}
   */
  static get SUFFIX() {
    return '...'
  }

  /**
   * Default padding char: ' '
   *
   * @type {String}
   */
  static get PADDING_CHAR() {
    return ' '
  }

  /**
   * Default padding length: 20
   *
   * @type {String}
   */
  static get DEFAULT_MAX_PADDING() {
    return 20
  }

  /**
   * Returns a string with length equals to 'max' (defaults to 20).
   *
   * If the provided str is shorter than that then c is used to padd the rest.
   * If it is longer than max, then a suffix (StringHelper.SUFFIX) is added at the end.
   *
   * @param {String} [str='']                               String to process.
   * @param {Number} [max=StringHelper.DEFAULT_MAX_PADDING] Defines the length
   *                                                        to target. Defaults to 20
   * @param {String} [c=StringHelper.PADDING_CHAR]          Defines what chart to padd
   *                                                        in case str is shorter
   *                                                        than max. Default is ' '
   *
   * @return {String} the reformated string.
   */
  static exact(
    str = '',
    max = StringHelper.DEFAULT_MAX_PADDING,
    c = StringHelper.PADDING_CHAR,
    isPrefix = false
  ) {
    let fixed = `${str}`

    if (str.length > max) {
      fixed = fixed.substring(0, max)
      if (max > StringHelper.SUFFIX.length) {
        fixed = fixed.substring(
          0,
          max - StringHelper.SUFFIX.length
        ) + StringHelper.SUFFIX
      }
    } else {
      const len = max - fixed.length + 1
      const padding = Array(len).join(c)
      fixed = !isPrefix ? str + padding : padding + str
    }

    assert(fixed.length === max,
      `StringHelper.exact: We have a bug with... ${fixed}: ${fixed.length} != ${max}`)

    return fixed
  }

  /**
   * Adds a prefix to a string up to a specfiied length.
   *
   * e.g. prefix ("Hi", 5, "Z") will result in "ZZZHi"
   *
   * @param {String} [str='']                               String to pad.
   * @param {[type]} [max=StringHelper.DEFAULT_MAX_PADDING] Total final length desired.
   *                                                        Includes Str and prefix added.
   * @param {[type]} [c=StringHelper.PADDING_CHAR]          What character to add as prefix.
   *
   * @return {String} A string with prefix with a 'max' length
   */
  static prefix(
    str = '',
    max = StringHelper.DEFAULT_MAX_PADDING,
    c = StringHelper.PADDING_CHAR
  ) {
    return StringHelper.exact(str, max, c, true)
  }

  /**
   * Parses a number string.
   *
   * @param {String} [value="0.00"]                     Value to parse. Can be string or numeric.
   * @param {String} [currencyPrefix="USD "]            When it a string, currency will be trimmed
   *
   * @return {number} Float number representing the value parsed
   */
  static parseNumber(value = '0.00', currencyPrefix = 'USD ') {
    let tmpVal = (value === '-' || value === '') ? '0.00' : value

    if (typeof tmpVal === 'string') {
      if (tmpVal.startsWith(currencyPrefix)) {
        tmpVal = tmpVal.substring(currencyPrefix.length)
      }
      // remove currency prefix

      tmpVal = tmpVal.replace(new RegExp(',', 'g'), '')
      // just in case, since Number.parseFloat() trims on ,
    }

    return Number.parseFloat(tmpVal)
  }

  /**
   * Parses a percent string.
   *
   * String value can have '%' as a suffix.
   * When number is passed, it will be return as a float.
   *
   * @param {String}  [value="0%"]       Value to parse
   * @param {Boolean} [bScaleToOne=true] If true, percent will be scaled to a numebr between 0..1
   *
   * @return {number}  Percent numeric value
   */
  static parsePercent(value = '0%', bScaleToOne = true) {
    let tmpVal = (value === '-' || value === '') ? '0%' : value

    if (typeof tmpVal === 'string') {
      tmpVal = tmpVal.replace('%', '')
      // removing the % sign if it is included
    }

    let percent = Number.parseFloat(tmpVal)

    if (bScaleToOne && percent > 1) {
      percent /= 100
    }

    return percent
  }

  /**
   * Parses a a boolean value.
   *
   * @param {String} [value=''] Value to parse.
   *
   * @return {boolean} If value is tring, returns true if lower ccase
   *                   value matches "yes", "true" or "1".
   *
   *                   If value is boolean, it is returned as is.
   */
  static parseBoolean(value = '') {
    if (typeof value === 'boolean') {
      return value
    }
    const v = value.toLowerCase()
    return (v === 'yes' || v === 'true' || v === 1)
  }

  /**
   * Returns a number with commans.
   *
   * e.g. addCommas (10000.321) will return "10,000.321"
   *
   * @param {number} x A number
   *
   * @return {string} Commas seperated by thousands
   */
  static addCommas(x) {
    const parts = x.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  /**
   * Formats a number ratio as a percent e.g. 0.3 => 30.0%, 1.153 => 115.3%
   *
   * @param {Number}                  ratio A ratio to format
   * @param {Number} [fixed=1]        number of digits after the point
   *
   * @return {String} String formated as string
   */
  static toPercent(ratio, fixed = 1) {
    return `${(ratio * 100).toFixed(fixed)}%`
  }

  /**
   * Scales a number to thouhsands.
   *
   * @param {Number}  number             Number to scale (can be float or int)
   * @param {Boolean} [isAddCommas=true] If true, adds commas; By default true
   *
   * @return {String}  formated number
   */
  static toThousands(number, isAddCommas = true) {
    const scaled = (number / 1000).toFixed(0)
    return isAddCommas ? StringHelper.addCommas(scaled) : scaled
  }

  /**
   * Convers a number to a string with a specfic precision.
   *
   * @param {Number} number    Number to convert. Must evaluate to a number.
   * @param {Number} [fixed=0] Number of digits to add, by default 0
   *
   * @return {[type]} [description]
   */
  static toNumber(x = 0, fixed = 0) {
    return (x * 1).toFixed(fixed)
  }
}