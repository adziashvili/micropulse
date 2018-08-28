import {
  JSONHelper,
  Analyzer
} from '..'

export default class Modeler {
  constructor(table) {
    this.table = table
    this.model = {}
    this.rows = []
    this.cols = []
    this.stats = []
    this.custom = []
  }

  build() {
    const model = {}
    this.construct(model)
    this.allocate(model)
    this.calculate(model)
    // this.describe( model )
    this.model = model
    return model
  }

  construct(model) {
    Object.assign(model, { key: 'root', value: 'root', rows: [] })

    this.addCols(model, this.cols)
    this.addRows(model, this.rows)
  }

  allocate(model, fRows = [], fCols = []) {
    // Get every relevant object called for record allocation
    for (const key in model) {
      if ({}.hasOwnProperty.call(model, key)) { // Avoid prototype keys listed
        switch (key) {
          case 'rows':
            model.rows.forEach((r) => {
              this.allocate(r, fRows.concat([r.value]), fCols)
            })
            break;
          case 'cols':
            model.cols.forEach((c) => {
              this.allocate(c, fRows, fCols.concat([c.value]))
            })
            break;
          default:
            if (typeof model[key] === 'object') {
              this.allocate(model[key], fRows.concat([model[key].value]), fCols)
            }
        }
      }
    }

    const filterList = this.getFilterList(fRows, fCols)
    model.records = this.table.list.filter(r => filterList.every((f) => {
      const transformer = this.transformer(f.key)
      return f.condition(transformer ? transformer(r[f.key]) : r[f.key])
    }))
    // Assigns to this entry the reocrds that match the filter
  }

  /**
   * Calculates the model based on rows and cols.
   *
   * It is a recursive function that will iterate through the available
   * records under each key and crease a stats object with all the calculations.
   *
   * @param {Object} model          Model to scan
   * @param {Array} [headers=null]  This is used by calculate. Do not pass value.
   *
   * @return {Nothing} No return value
   */
  calculate(model, headers = null) {
    const headersToUse = headers === null ? this.statsHeaders : headers
    // we want to avoid calling this.statsHeaders every time since it
    // a computed property

    for (const key in model) {
      if (typeof model[key] === 'object' && Array.isArray(model[key])) {
        model[key].forEach((m) => { this.calculate(m, headersToUse) })
      }
    }
    // fork cols and rows

    if (model.records) {
      const stats = { count: model.records.length }
      // Adding number of matching records

      headersToUse.forEach((h) => {
        stats[h.header] = Analyzer.analyze(h.type,
          model.records.map(r => r[h.header]))
      })
      // Based on the type of the values, all values for each header are analysed

      model.stats = stats
    }
    // if the model has records, stats are caluclated
  }

  /**
   * Returns the transform function for a specfic key.
   *
   * @param {String} key Key
   *
   * @return {function} If found, the transform function is returned. Null otherwise
   */
  transformer(key, isGetEntry = false) {
    const {
      cols,
      rows,
      stats,
      custom
    } = this

    const transformers = [cols, rows, stats, custom]

    for (let i = 0; i < transformers.length; i += 1) {
      const candidate = transformers[i].find(item => item.key === key)
      if (candidate) {
        return isGetEntry ? candidate : candidate.transform
      }
    }

    return isGetEntry ? undefined : null
  }

  getFilterList(fRows, fCols) {
    const filterList = []
    const list = [
      { fValues: fRows, settings: this.rows },
      { fValues: fCols, settings: this.cols }
    ]

    list.forEach((obj) => {
      const { fValues, settings } = obj
      fValues.forEach((f, i) => {
        const { key, rollup } = settings[i]
        if (!!rollup && rollup.key === f) {
          filterList.push({
            key,
            condition: v => rollup.values.includes(v)
          })
        } else {
          filterList.push({
            key,
            condition: v => v === f
          })
        }
      })
    })

    return filterList
  }

  describe(model) {
    console.log('\n---\nMODEL\n'.green);
    console.log(JSONHelper.stringify(model).grey);
  }

  describeAspects(strKey) {
    const description = []
    this[strKey].forEach((aspect) => {
      const distinctValues = this.table.distinct(aspect.key, this.transformer(aspect.key))
      const maxStringLength = Math.max(...distinctValues.map(v => `${v}`.length))
      const count = distinctValues.length
      description.push({
        key: aspect.key,
        count,
        maxStringLength,
        distinctValues
      })
    })
    return description
  }

  expand(model, prop, prev = [], kvps = []) {
    if (!!model[prop] && model[prop].length > 0) {
      model[prop].forEach((item) => {
        const newPrev = model.key === 'root' ? prev : prev.concat([{
          key: model.key,
          value: model
            .value
        }])
        this.expand(item, prop, newPrev, kvps)
      })
    } else {
      kvps.push(prev.concat([{ key: model.key, value: model.value }]))
    }

    return kvps
  }

  find(key, rows = [], cols = []) {
    let { model } = this

    if (cols.length > 0) {
      model = this.filter('cols', cols, model)
    }

    if (undefined === model) return undefined

    if (rows.length > 0) {
      model = this.filter('rows', rows, model)
    }

    return undefined === model ? undefined : model[key]
  }

  filter(key, kvp = [], model = {}) {
    if (kvp.length === 0) return model

    const condition = kvp[0]
    let myModel = model[key].find(m => m.key === condition.key && m.value === condition.value)
    if (undefined === myModel) {
      return undefined
    }

    if (kvp.length > 1) { // being asked to go one level deeper
      if (!myModel[key]) return undefined
      const [, ...next] = kvp
      myModel = this.filter(key, next, myModel)
    }

    return myModel
  }

  addRows(data, rows) {
    if (rows.length === 0) return

    const { key, transform, rollup } = rows[0]
    const type = this.table.getType(key)

    if (data.rows) {
      const values = this.table.distinct(key, transform)
      if (!!rollup && !!rollup.key) {
        values.push(rollup.key)
      }
      values.forEach((value) => {
        const [, ...next] = rows
        const newRow = {
          key,
          value,
          type,
          rows: []
        }
        data.rows.push(newRow)
        this.addRows(newRow, next)
      })
    }

    if (Array.isArray(data.cols)) {
      data.cols.forEach((c) => {
        this.addRows(c, rows)
      })
    }
  }

  // TODO: Do we want to add roolup for cols?
  addCols(data, cols) {
    if (cols.length === 0) return
    // nothing to add

    const { key, transform } = cols[0]
    const type = this.table.getType(key)
    const values = this.table.distinct(key, transform)

    data.cols = []
    values.forEach((value) => {
      data.cols.push({
        key,
        value,
        type,
        rows: []
      })
    })
    // Adding a stackby model to the data model we got

    if (cols.length > 1) {
      const [, ...next] = cols
      data.cols.forEach((g) => {
        this.addCols(g, next)
      })
    }
    // For each of the values we have under the added stacks, if there
    // is more cols, they are added.
  }

  // GETTERS and SETTERS
  // -------------------

  set rows(rows = []) {
    if (rows.length > 0) {
      const keys = rows.map(row => row.key)
      if (!this.table.isValidHeaders(keys)) {
        throw new Error('Invalid rows. Check Spelling or misplaced spaces in rows headers'.red)
      }
    }
    this._rows = rows
  }

  get rows() {
    return this._rows
  }

  set cols(cols) {
    if (cols.length > 0) {
      const keys = cols.map(col => col.key)
      if (!this.table.isValidHeaders(keys)) {
        throw new Error('Invalid cols. Check Spelling or misplaced spaces in cols headers'.red)
      }
    }
    this._cols = cols
  }

  get cols() {
    return this._cols
  }

  set stats(stats) {
    if (stats.length > 0 && !this.table.isValidHeaders(stats.map(s => s.key))) {
      throw new Error('Invalid cols: All headers must be valid headers in the file')
    }
    this._stats = stats
  }

  get stats() {
    return this._stats
  }

  set custom(custom) {
    this._custom = custom
  }

  get custom() {
    return this._custom
  }

  get statsHeaders() {
    return this.table.headers.filter((h) => {
      const isRows = this.rows.some(r => r.key === h.header)
      const isCols = this.cols.some(c => c.key === h.header)
      return ['date', 'number', 'currency'].includes(h.type) || (!isRows && !isCols)
    })
  }

  get table() {
    return this._table
  }

  set table(table) {
    this._table = table
  }

  set model(model) {
    this._model = model
  }

  get model() {
    return this._model
  }
}
