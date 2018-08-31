import {
  ReportHelper,
  DateHelper,
  StringHelper as SH,
  StringBuffer,
  Layout,
  Dictionary,
  Analyzer
}
from '..'

export default class Reporter {
  constructor(modeler, isAddTotal = true, isVerbose = false) {
    this.modeler = modeler
    this.isAddTotal = isAddTotal
    this.rh = new ReportHelper(modeler.table.meta.name, modeler.table.meta.date)
    this.layout = new Layout()
    this._dictionary = new Dictionary(Analyzer.dictionary())
    this.isVerbose = isVerbose
  }

  set dictionary(dictionary) {
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

    this.addHeaders()
    rh.newLine()
    // Adding headers

    this.addRowsCascade(model)
    // adding the data

    this.addTotal()
    rh.newLine()
    // Printing totals first. This is a matter of style.

    if (isVerbose) {
      this.addStats(stats)
      // Printins the requested stats
    }
  }

  addTotal() {
    const key = 'TOTAL'
    const total = this.getStats(this.dictionary.get(key))
    this.addRow(total, s => s.bold)
    this.addCustoms(key, [])
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

    return values
  }

  push(values, objStats) {
    const { stats } = this.modeler
    const NA = 'N/A'

    if (!objStats ||
      !Array.isArray(stats) ||
      stats.length === 0) {
      values.push(NA)
      return
    }

    const { key } = stats[0]
    let { stat } = stats[0]

    if (!stat) {
      stat = Analyzer.getDefaultStatKey(this.modeler.table.getType(key))
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
    return this.defaultFormat(this.modeler.table.getType(key), value)
  }

  getStatFormatType(key, property) {
    if (!Analyzer.typeSensitiveStats().includes(property)) {
      return 'number'
    }

    const type = this.modeler.table.getType(key)

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

  addRowsCascade(model, filter = [], level = 0) {
    if (model.rows) {
      model.rows.forEach((row) => {
        const newFilter = {
          key: row.key,
          value: row.value
        }

        this.addRow(
          this.getStats(
            this.layout.nestedIndent(level) + row.value,
            filter.concat(newFilter)
          ),
          level !== 0 ? undefined : s => s.bold
        )
        // Printing data

        if (row.rows) {
          this.addRowsCascade(row, filter.concat(newFilter), level + 1)
        }
        // Forking for other children

        // if ( level !== 0 && index === rows.length - 1 ) {
        //     console.log( this.layout.nestedIndent( level ) + "Total" );
        // }

        if (level === 0) {
          // this.rh.newLine( 1, this.modeler.rows.length > 1 )
          this.addCustoms(row.value, filter.concat(newFilter), level + 1)
          // if ( this.modeler.rows.length > 1 ) {
          this.rh.addDevider()
          console.log()
          // }
        }
        // Seperating the groups of rows
      })
    }
  }

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

  addHeaders() {
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
      console.log(sb.toString().toUpperCase().bold);
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

    const sb = new StringBuffer()
    for (let i = 0; i < values.length; i += 1) {
      if (i === values.length - 1 && values.length > 1) {
        sb.append(totalSeperator)
      }
      if (i > 0) {
        sb.appendPad(values[i], vLengths[i])
      } else {
        sb.appendExact(values[i], vLengths[i])
      }
    }
    console.log(!decorator ? sb.toString() : decorator(sb.toString()))
  }
}
