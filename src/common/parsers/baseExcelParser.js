const UNKNOWN = 'UNKNOWN'

export default class BaseExcelParser {
  constructor(ws) {
    this.ws = ws
    this.lookups = []

    this.meta = this.parseMeta()
  }

  /**
   * Lookups the value name based on SFDC value name convention
   *
   * @param {String} str Practice name as in SFDC input file
   *
   * @return {String} The Micropulse convention for the value name.
   *                  "UNKNOWN" if not found or if lookup str is null or 'undefined'
   */
  lookup(str) {
    let value = UNKNOWN

    if (str === null || !str) {
      return UNKNOWN
    }

    const lookup = this.lookups.filter(p => p.lookup.toLowerCase() === str.toLowerCase())

    if (lookup.length === 1) {
      value = lookup[0].name
    }

    return value
  }

  /**
   * Returns headers names.
   *
   * @return {Array} Array of strings representing the header names
   */
  getHeaderNames() {
    const { headersRow } = this.meta
    if (!headersRow) return undefined
    return this.getRowValues(headersRow)
  }

  /**
   * Reads values of a given row from col = 1 until null is reached.
   *
   * @param {Number} rowIndex The index of the row.
   *
   * @return {Array} Array of values as read for the row.
   */
  getRowValues(rowIndex) {
    let { firstDataCol } = this.meta
    if (!firstDataCol) {
      firstDataCol = 1
    }
    return this.readRow(firstDataCol, rowIndex)
  }

  /**
   * Reads a colunm values
   *
   * @param {Number} colIndex Zero based index of the col to read
   *
   * @return {Array} Array of values for that specfic row
   */
  getColValues(colIndex) {
    const { firstDataRow, lastDataRow } = this.meta
    return this.readCol(colIndex + 1, firstDataRow, lastDataRow)
  }

  /**
   * Reads a row starting from Col and Row.
   *
   * @param {Number} col Col to start from
   * @param {Number} row Row to scan
   *
   * @return {Array} Returns array of values
   */
  readRow(col, row) {
    const values = []
    let colunm = col
    const forever = true

    while (forever) {
      const { value } = this.ws.getCell(`${this.COLUMNS[colunm - 1]}${row}`)

      if (value !== null) {
        values.push(value)
        colunm += 1
      } else {
        break
      }
    }
    return values
  }

  /**
   * Reads colunm values starting from row number - inRow through
   * inrowEnd.
   *
   * @param {Number} col    Number of colunm to read, first col is 1
   * @param {Number} inRow  Row number to start reading from
   * @param {Number} rowEnd Row number to read through (included in the result)
   *
   * @return {Array} Array of values read from the worksheet for a give colunm.
   */
  readCol(col, inRow, rowEnd) {
    const values = []
    let row = inRow

    while (row <= rowEnd) {
      const { value } = this.ws.getCell(`${this.COLUMNS[col - 1]}${row}`)
      if (value !== null) {
        values.push(value)
        row += 1
      } else {
        break
      }
    }
    return values
  }

  /**
   * Reads a cell value
   *
   * @param {String} cell e.g. A7
   *
   * @return {any} As read from the file
   */
  readCell(cell) {
    return this.ws.getCell(cell).value
  }

  /**
   * Scan down to find a lookup string scanning from A1 downwards
   *
   * @param {string} lookup Value to look for
   * @param {string} col Col to scan
   * @param {number} row Starting row
   *
   * @return {number} the row number where the lookup was found
   */
  lookDown(lookup, col = 'A', row = 1) {
    return this.lookDownCondition(v => v !== null && !!v && v.toLowerCase().startsWith(lookup.toLowerCase()),
      col, row).row
  }

  /**
   * Scans down for a first non-null value
   *
   * @param {String} [col='A'] Column to scale
   * @param {Number} [row=1]   Starting row
   *
   * @return {[type]} Row number for first match
   */
  lookDownAny(col = 'A', row = 1) {
    return this.lookDownCondition(v => v !== null, col, row).row
  }

  /**
   * Scans down for a first null value from a given row for a given column
   *
   * @param {String} [col='A'] Column to scale
   * @param {Number} [row=1]   Starting row
   *
   * @return {[type]} First row number who's value is null
   */
  lookDownNull(col = 'A', row = 1) {
    return this.lookDownCondition(v => v === null, col, row).row
  }

  /**
   * Scans values from col:row downwards untill condition is met. If
   * condition is null, none null value is searched for - i.e. ANY value.
   *
   * @param {[type]} [condition=null] Condition to halt on.
   * @param {String} [col="A"]        Colunm to scan, by default 'A'
   * @param {Number} [startRow=1]     Starting row, by default 1
   * @param {Number} [attempts]       Attempts before giving up.
   *                                  If not provided defaults to sheets rowCount.
   *
   * @return {[type]} The first row number where the condition is met.
   *                  -1 if failed to meet condition for 1000 rows
   *                  scanned below 'row'
   */
  lookDownCondition(condition = null, col = 'A', startRow = 1, inAttempts) {
    const attempts = !inAttempts ? this.ws.rowCount : inAttempts
    let row = startRow
    let { value } = this.ws.getCell(col + row)
    let isTrue = condition === null ? value !== null : condition(value)

    while (!isTrue && row < attempts) {
      row += 1
      value = this.ws.getCell(col + (row)).value
      isTrue = condition === null ? value !== null : condition(value)
    }
    return value === null ? { row: this.NOT_FOUND, value } : { row, value }
  }

  /**
   * Reads the report date.
   *
   * @return {Date} Report date
   */
  getReportDate() {
    if (!this.meta || !this.meta.date) {
      return new Date(Date.now())
    }
    return this.meta.date
  }

  /**
   * Reads the report name from cell A!
   *
   * @return {String} The report name or "UNKNOWN REPORT NAME" if not found
   */
  getReportName() {
    if (!this.meta || !this.meta.name) {
      return this.ws.sheetName
    }
    return this.meta.name
  }

  isCompatible() {
    return Object.keys(this.meta).every(v => v !== -1)
  }

  /**
   * Extract the key Meta data of the worksheet and returns an object
   * with the following properties:
   *  name: Name of the report
   *  date: Date of the report
   *  headersRow: The row number that includes the headers (-1 if not found).
   *  firstDataRow: The row number that includes the frist data row (-1 if not found)
   *  lastDataRow: The row number that includes the last data row (-1 if not found)
   *  firstDataCol: The first data column index (assumed 1 for now)
   *
   * @return {Object} Worksheet metadata object.
   */
  parseMeta() {
    const analysis = {
      headersRow: -1,
      firstDataRow: -1,
      lastDataRow: -1,
      firstDataCol: 1 // naive assumption
    }
    const firstRow = this.lookDownAny()

    if (firstRow !== -1) {
      analysis.firstDataRow = firstRow + 1
      const lastRow = this.lookDownNull('A', firstRow)
      if (lastRow !== -1) {
        analysis.lastDataRow = lastRow
        if (lastRow > firstRow) {
          analysis.headersRow = firstRow
        }
      }
    }

    return Object.assign({},
      analysis, {
        name: this.getReportName(),
        date: this.getReportDate()
      })
  }

  get meta() {
    return this._meta
  }

  set meta(meta) {
    this._meta = meta
  }

  get COLUMNS() {
    return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K',
      'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
      'W', 'X', 'Y', 'Z'
    ]
  }

  get NOT_FOUND() {
    return -1
  }
}
