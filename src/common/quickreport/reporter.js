import { Dictionary } from 'ika-datamart'

import {
  StringHelper as SH,
  StringBuffer,
  DateHelper,
  ReportHelper,
  Statistics
} from 'ika-helpers'

import {
  TableReporter,
  TableSummeriser,
  Layout
}
from '..'

export default class Reporter {
  constructor({
    modeler,
    dictionary,
    isAddTotal = true,
    isAddTotalRow = true,
    isRepeatHeaders = true,
    firstColShrinkBy = 0,
    otherColShrinBy = 0,
    listConfig = undefined,
    isVerbose = false
  } = {}) {
    this.modeler = modeler
    this.isAddTotal = isAddTotal
    this.isAddTotalRow = isAddTotalRow
    this.isVerbose = isVerbose
    this.isRepeatHeaders = isRepeatHeaders
    this.listConfig = listConfig

    this.reaptHeaderStyle = ''.dim
    this.rh = new ReportHelper(modeler.table.meta.name, modeler.table.meta.date)
    this.layout = new Layout()

    this.layout.firstColShrinkBy = firstColShrinkBy
    this.layout.otherColShrinBy = otherColShrinBy

    this._dictionary = new Dictionary(Statistics.dictionary())
    this.dictionary = dictionary

    this.summary = []
    this.verbatim = []
  }

  set dictionary(dictionary) {
    if (!dictionary) return
    this._dictionary = this.dictionary.add(dictionary)
  }

  get dictionary() {
    return this._dictionary
  }

  report(isVerbose = false) {
    const { model, stats, table } = this.modeler
    const { layout, rh } = this
    // localizing some variables

    this.rowsKVPs = this.modeler.expand(model, 'rows')
    this.colsKVPs = this.modeler.expand(model, 'cols')
    // We rather keep these calls here in case the underlying data changes

    layout.rebuild(this.modeler)
    this.rh.setDivider({
      len: layout.totalSeperator.length +
        layout.lengths[layout.lengths.length - 1]
        .reduce((sum, len) => sum + len)
    })
    // Optimizing the layout to the actual data

    rh.addReportTitle()
    const dh = new DateHelper(table.meta.date)
    console.log('Data: %s records as for %s',
      table.meta.lastDataRow - table.meta.firstDataRow + 1,
      dh.localeDateString)
    rh.newLine()
    // Adding report title

    if (!this.isRepeatHeaders) {
      this.addHeaders()
      rh.newLine()
    }
    // Adding headers

    this.addRowsCascade(model)
    // adding the data

    rh.addDevider()

    if (isVerbose) {
      this.addStats(stats)
      // Printins the requested stats
    }

    rh.newLine(2)

    return { summary: this.summary, verbatim: this.verbatim }
  }

  addHeadersOnRepeat() {
    if (this.isRepeatHeaders) {
      this.addHeaders(this.reaptHeaderStyle)
    }
  }

  addStats(stats) {
    // let rowStats = this.getRowStats()
    const rowStats = this.getRowData([], 'stats')
    stats.forEach((stat) => {
      const values = rowStats.map(obj => obj[stat.key])
      this.addStat(stat.key, values)
      this.rh.newLine()
    })
  }

  addStat(key, values) {
    const sample = values[0]
    this.addRow([this.dictionary.get(key)], s => s.grey.bold)
    for (const skey in sample) {
      if ({}.hasOwnProperty.call(sample, skey)) {
        const statsValues = [this.layout.indent + this.dictionary.get(skey)]
        const type = this.getStatFormatType(key, skey)
        values.forEach((v) => {
          statsValues.push(this.defaultFormat(type, v[skey]))
        })
        this.addRow(statsValues, s => s.grey)
      }
    }
  }

  getStats(firstValue = '', rowFilter = []) {
    const values = [firstValue]
    const stats = this.getRowData(rowFilter)
    stats.forEach((s) => { this.push(values, s) })

    return values
  }

  getRowData(rowFilter = [], property = 'stats') {
    const values = []

    this.colsKVPs.forEach((cKvp) => {
      const v = this.modeler.find(property, rowFilter, cKvp)
      if (v !== undefined) values.push(v)
    })

    if (this.isAddTotal) {
      const v = this.modeler.find(property, rowFilter, [])
      if (v !== undefined) values.push(v)
    }
    // Adding total to the row

    return values
  }

  push(values, objStats) {
    const { stats } = this.modeler
    const NA = 'N/A'

    if (!objStats || !Array.isArray(stats) || stats.length === 0) {
      values.push(NA)
      return
    }

    const { key } = stats[0]
    let { stat } = stats[0]

    if (!stat) {
      stat = Statistics.getDefaultStatKey(this.modeler.table.keyType(key))
    }

    if (!Object.keys(objStats).includes(key) || !Object.keys(objStats[key]).includes(stat)) {
      values.push(NA)
      return
    }

    values.push(this.format(key, objStats[key][stat]))
  }

  format(key, value) {
    const transformer = this.modeler.transformer(key)
    if (transformer) {
      return transformer(value)
    }
    return this.defaultFormat(this.modeler.table.keyType(key), value)
  }

  getStatFormatType(key, property) {
    if (!Statistics.typeSensitiveStats().includes(property)) {
      return 'number'
    }

    const type = this.modeler.table.keyType(key)

    if (type === 'boolean' && ['avg', 'avgNonEmpty'].includes(property)) {
      return 'percent'
    }

    return type
  }

  defaultFormat(type = 'number', value) {
    switch (type) {
      case 'currency':
        return `$${SH.toThousands(value)}`
      case 'percent':
        return SH.toPercent(value)
      case 'date':
        return new DateHelper(value).shortDate
      case 'number':
      case 'string':
      case 'boolean':
      default:
        return SH.toNumber(value)
    }
  }

  isRollup(key) {
    const { rows } = this.modeler
    for (let i = 0; i < rows.length; i += 1) {
      if (Object.keys(rows[i]).includes('rollup') &&
        // rows[i].rollup.find(r => r.key === key)) {
        rows[i].rollup.key === key) {
        return true
      }
    }
    return false
  }

  addRowsCascade(model, filter = [], level = 0) {
    if (model.rows) {
      model.rows.forEach((row) => {
        if (row.value === 'TOTAL' && !this.isAddTotalRow) return

        const isRollup = this.isRollup(row.value)
        const newFilter = { key: row.key, value: row.value }
        let rowStats = this.getStats(
          this.layout.nestedIndent(level) + row.value,
          filter.concat(newFilter)
        )

        if (level === 0) {
          rowStats = rowStats.map(m => (m === 'N/A' ? '' : m))
          // Removing N/A for the first row

          if (isRollup || row.value === 'TOTAL') this.rh.addDevider()
          this.addHeadersOnRepeat()
          this.summary.push(rowStats)
        }

        this.addRow(rowStats, level !== 0 ? undefined : s => s.bold)
        // Printing data

        if (row.rows) {
          this.addRowsCascade(row, filter.concat(newFilter), level + 1)
        }
        // Forking for other children

        if (level === 0) {
          this.addCustoms(row.value, filter.concat(newFilter), level + 1)
          this.list(row, level + 1)
          this.rh.newLine(2)
          if (isRollup) {
            this.rh.newLine(2)
          }
        }
        // Seperating the groups of rows
      })
    }
  }

  /**
   * Adds a custom calculation to the report.
   *
   * Each custom calculation is expected to have a configuraiotn object with the following:
   *
   *  isVerbose:  Optional boolean, defaults to false.
   *              If true, the custom calculation will be included only when the report
   *              runs in verbose mode as controlled by Reporter's isVerbose property.
   *
   *  key:  Required string, the Name used to idenfity this custom calculation.
   *        This key will be used to lookup details about the this custom function, so it is always required.
   *        When isRowTransformer=true, key will apear in the report as the row name.
   *
   *  transform: Required function.
   *             Based isRowTransformer, trasnform will be invoked with these parameters to
   *             perfrom its analysis:
   *     records:     The records array matching to the row-col pair being calculated.
   *                  When isRowTransformer = true, this is and empty array, []
   *     modeler:     The modeler object that is used to calculate the report data.
   *                  This provides access to all the data available to the reporter.
   *     allRecords:  An array of all the colunms records for the matching row including total.
   *     key:         The key of the row being analysed
   *
   *     All trasnform functions are expected to return a value or an array of values
   *     depending on isRowTransformer field.
   *
   *  isRowTransformer: Optional boolean, defaults to false.
   *    When true,
   *        Reporter will invoke transform with four argements: [], modeler, allRecords and key.
   *        tranfrom function should return as array of ready to print values.
   *        Before printing key and padding at the begining of the row.
   *    When false,
   *        Reporter will invoke transform for each matcihng colunm expcting a single return value.
   *
   *  isBreakLineBefore: Optional bollena, defaults to false.
   *                     If true, a line break id added before the custom row.
   *
   *
   * @param {[type]} key       [description]
   * @param {[type]} filter    [description]
   * @param {Number} [level=1] [description]
   */
  addCustoms(key, filter, level = 1) {
    const { custom } = this.modeler

    custom.forEach((c) => {
      if (!this.isVerbose && Object.keys(c).includes('isVerbose') && c.isVerbose) return
      const transformer = this.modeler.transformer(c.key, true)

      if (transformer && transformer.transform) {
        const recs = this.getRowData(filter, 'records')
        let values = [this.layout.nestedIndent(level) + c.key]

        if (transformer.isRowTransformer) {
          values = [...values, ...transformer.transform([], this.modeler, recs, key)]
        } else {
          recs.forEach((colRecords, index, allRecordsArray) => {
            values.push(transformer.transform(colRecords, this.modeler, allRecordsArray))
          })
        }

        if (transformer.isBreakLineBefore) this.rh.newLine()
        this.addRow(values)
      }
    })
  }

  addHeaders(style = ''.bold) {
    const { layout } = this
    const { cols, totalSeperator, firstColWidth } = layout

    cols.forEach((col, i) => {
      const headers = layout.getHeaders(i, this.isAddTotal)
      const sb = new StringBuffer()
      headers.forEach((h, j) => {
        if (j === headers.length - 1 && headers.length > 1) {
          sb.append(totalSeperator)
        }
        if (j >= 0) {
          sb.appendPad(h.value, h.length)
        } else { // first
          sb.appendExact(h.value, firstColWidth)
        }
      })
      console.log(SH.style(sb.toString(), style));
    })
  }

  getHeaderValues() {
    const { layout } = this
    const { cols } = layout
    return layout.getHeaders(cols.length - 1, this.isAddTotal)
  }

  /**
   * Prints a row of values to STD out according to the layout.
   *
   * If decorator is provided, the decorator is passed the final string
   * for decoration prior to printing.
   *
   * @param {Array} values                    Values to print
   * @param {Function} [decorator=undefined]  A function that recieves one string
   *                                          and is expected to return a string.
   */
  addRow(values, decorator = undefined) {
    const { lengths, totalSeperator } = this.layout
    const vLengths = lengths.length > 0 ? lengths[lengths.length - 1] : []

    if (vLengths.length < values.length) {
      const msg =
        `Ooops! we have a bug... expecting at least ${values.length} entries in vLengths`
      throw new Error(msg)
    }

    const verbatimValues = []
    const sb = new StringBuffer()
    for (let i = 0; i < values.length; i += 1) {
      if (i === 0) {
        values[0] = this.dictionary.get(values[0])
      }
      if (i === values.length - 1 && values.length > 1) {
        sb.append(totalSeperator)
      }
      if (i > 0) {
        sb.appendPad(values[i], vLengths[i])
      } else {
        sb.appendExact(values[i], vLengths[i])
      }
      verbatimValues.push(values[i])
    }

    this.verbatim.push(verbatimValues)
    console.log(!decorator ? sb.toString() : decorator(sb.toString()))
  }

  /**
   * Lists the records per listConfig
   *
   * @param {Object} row     Row that holds records
   * @param {Number} nesting Nesting level
   *
   * @return {undefined} None
   */
  list(row, nesting) {
    if (!this.listConfig || !Array.isArray(row.records)) return

    const { listConfig: conf } = this
    const padding = this.layout.nestedIndent(nesting)

    const trConf = Object.assign({}, conf)
    trConf.headers = conf.displayKeys.map(m => this.dictionary.get(m))
    trConf.types = conf.displayKeys.map(m => this.modeler.table.keyType(m))
    trConf.padding = padding
    if (conf.summerise) {
      trConf.summeriser = new TableSummeriser(conf.summerise)
    }

    new TableReporter(row.records, trConf).report()
  }
}
