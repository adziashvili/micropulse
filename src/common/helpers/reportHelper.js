import {
  StringHelper,
  StringBuffer,
  DateHelper
}
from '..'

const DEFAULT_DIVIDER_LEN = 80
const DEFAULT_DIVIDER_CH = '-'

const DEF_DIVIDER = {
  LEN: DEFAULT_DIVIDER_LEN,
  CH: DEFAULT_DIVIDER_CH
}

/**
 * An aggregation of utilities needed for consistent and quick reporting formating.
 *
 * @type {Class}
 */
export default class ReportHelper {
  /**
   * Expects the required two inputs NAME for the report and DATE.
   *
   * @param {String} reportName Name of the report
   * @param {Date} date The daye for which the rpeort is generated for.
   */
  constructor(reportName = '', date = new Date()) {
    this.reportName = reportName
    this.date = date
    this.setDivider()
  }

  /**
   * Builds the divider used by ReportHelper.
   *
   * Pass option with len and ch to setup the divider.
   *
   * @param {Object} options Can include len and ch properties.
   *                         len defaults to DEF_DIVIDER.LEN
   *                         ch defaults to DEF_DIVIDER.CH
   */
  setDivider({
    len = DEF_DIVIDER.LEN,
    ch = DEF_DIVIDER.CH
  } = DEF_DIVIDER) {
    this._divider = new StringBuffer().appendTimes(ch, len).toString()
  }

  /**
   * Divider is used when addDevider is called to add visual break in the report.
   *
   * @return {String} The divider.
   */
  get divider() {
    return this._divider
  }

  /**
   * Trending up green symbol.
   */
  get UP() {
    return '\u25B4'.green
  }

  /**
   * Trending down red symbol.
   */
  get DOWN() {
    return '\u25Be'.red
  }

  /**
   * No change grey symbol.
   */
  get NO_CHANGE() {
    return '-'.grey
  }

  /**
   * [addChangeSymbol description]
   *
   * @param {[type]} v    [description]
   * @param {[type]} vStr [description]
   */
  addChangeSymbol(v, vStr) {
    if (v > 0) return `${this.UP} ${vStr}`
    if (v < 0) return `${this.DOWN} ${vStr}`
    return `${this.NO_CHANGE} ${vStr}`
  }

  addChangeColor(value, valueString) {
    if (value > 0) return valueString.green
    if (value < 0) return valueString.red
    return valueString.grey
  }

  addTrafficLights(value, valueString, target, goYellowThreahold) {
    if (value >= target) return valueString.green
    if (value >= target * goYellowThreahold) return valueString.yellow
    return valueString.red
  }

  /**
   * Prints a bold underline title string as passed in the constructor reportName
   *
   * @param {[type]} newTitle     Prints this title instead of the rpeort name
   * @param {Number} [newlines=0] Add new lines as defined in this input parameter
   */
  addReportTitle(newTitle, newlines = 0) {
    const title = !newTitle ?
      this.reportName :
      newTitle

    this.addWhiteSpece(newlines)
    console.log('%s', title.bold.underline);
  }

  /**
   * Add few new lines to stdout.
   *
   * @param {Number} [newlines=1] Number of new lines to add. By default 1
   */
  addWhiteSpece(newlines = 1) {
    let lines = newlines
    let whiteSpace = ''
    while (lines > 0) {
      whiteSpace += '\n'
      lines -= 1
    }
    console.log(whiteSpace);
  }

  /**
   * Add a grey italic subtitle to the stdout
   *
   * @param {String} subtitle Subtitle to print
   */
  addSubtitle(subtitle) {
    console.log('%s\n'.grey.italic, subtitle);
  }

  /**
   * Adds a divider to the stdout.
   *
   * @param {String}  [name=""]             Name to check agasint the addOnlyForNames input.
   * @param {Array}   [addOnlyForNames=[]]  Qualifies the name. If this array of strings includes the name, the divider will be printed
   * @param {Boolean} [bAddNewLine=false]   If true, a new line will be added before the divider
   */
  addDevider(name = '', addOnlyForNames = [], bAddNewLine = false) {
    if (addOnlyForNames.length === 0 || addOnlyForNames.includes(name)) {
      let dividerStr = this.divider
      if (bAddNewLine) {
        dividerStr += '\n'
      }
      console.log(dividerStr.grey);
    }
  }

  /**
   * Add month names to a firstValue (e.g. Name)
   *
   * @param {String} [firstValue=""] Baseline of the colounm row
   * @param {Date} toMonth     How many months to add
   */
  addHeaderAsMonths(firstValue = '', toMonth) {
    const uptoMonth = !toMonth ?
      this.date.getMonth() :
      toMonth

    let header = StringHelper.exact(firstValue, 12)

    for (let month = 0; month < uptoMonth; month += 1) {
      header += `\t${DateHelper.getMonthName(month)}`
    }

    header += '\t|  YTD'
    // print col titles

    console.log('\n%s'.bold, header)
    // print title
  }

  /**
   * Prints a bolded line with firstValue and Month names as indicated with the months array.
   *
   * The line will be firstLine month1 month 2... and last element will be "TOTAL"
   *
   * @param {Array}  [months=[]]     Each element should have month correstponding to the month index.
   * @param {String} [firstValue=""] [description]
   * @param {Object} layout          Can include {indent = "", firstColWidth = 20, otherColWidth = 10, totalSeperator = " | "}.
   *                                 See layout details @addValues for details.
   */
  addHeaderAsMonthsArray(months = [], firstValue = '', layout) {
    const values = months.map((m) => {
      if (m.month !== -1) return DateHelper.getMonthName(m.month)
      return 'TOTAL'
    })
    // Get all the months headers

    values.unshift(firstValue)
    // Add to head of array

    this.addValues(values, layout, str => str.bold)
  }

  /**
   * Formats and prints values (array) to stdout according to the layout and decorator.
   *
   * e.g. addValues( values, layout, ( str ) => { return str.bold } )
   *
   * Layout is an object (like options) that provides formating details and includes:
   * {indent = "", firstColWidth = 20, otherColWidth = 10, totalSeperator = " | "}
   *
   * @param {Array}  [values=[]]        Array of string values.
   * @param {String} [indent=""]        Indent is a string added after the first
   *                                    value and before any other value.
   * @param {Number} [firstColWidth=20] The first value will be exactly this length.
   *                                    It will be padded iwth " " if needed.
   * @param {Number} [otherColWidth=10] The 2nd and following values in the array will be
   *                                    exactly of otherColWidth in length adding " " if needed.
   * @param {String} [totalSeperator= " | "    } = layout] totalSeperator will be added before the last element.
   *                                    Layout is an object that includes details on how to format the values into a line.
   * @param {[type]} [decorator=null]   If provided, decorator will be passed the final string for formating before printing.
   */
  addValues(values = [], {
    indent = '',
    firstColWidth = 20,
    otherColWidth = 10,
    totalSeperator = ' | '
  }, decorator = null) {
    const sb = new StringBuffer()

    for (let i = 0; i < values.length; i += 1) {
      if (i > 0 && i < values.length - 1) {
        sb.appendPad(indent + values[i], otherColWidth)
      } else if (i === 0) {
        sb.appendExact(values[i], firstColWidth)
        sb.append(indent) // How we generalise this?
      } else {
        sb.append(totalSeperator)
        sb.appendPad(values[i], otherColWidth)
      }
    }

    console.log(decorator === null ? sb.toString() : decorator(sb.toString()))
  }

  /**
   * Adds a new line to stdout.
   *
   * @return {nothing} Does not return a value.
   */
  newLine(times = 1, condition = true) {
    let count = times
    if (condition) {
      while (count > 0) {
        console.log()
        count -= 1
      }
    }
  }

  add(str = '') {
    console.log(str);
  }
}
