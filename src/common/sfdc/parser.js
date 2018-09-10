const assert = require('assert')

const REPORT_NAME_CELL = 'A1'
const REPORT_DATE_CELL = 'A6'

export default class Parser {
  constructor(ws) {
    this.ws = ws
    this.records = []
    this.practices = [
      { name: 'ANZ', lookup: 'ANZ' },
      { name: 'ASEAN', lookup: 'ASEAN' },
      { name: 'INDIA', lookup: 'INDIA' },
      { name: 'S.KOREA', lookup: 'S. KOREA' },
      { name: 'APAC', lookup: 'APAC' },
      { name: 'JAPAN', lookup: 'JAPAN' },
      { name: 'APJ Shared', lookup: 'APJ Shared' },
      { name: 'APJ', lookup: 'APJ' }
    ]
  }

  get CELLS() {
    return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K',
      'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
      'W', 'X', 'Y', 'Z'
    ]
  }

  get NOT_FOUND() {
    return -1
  }

  parse() {
    throw new Error('Exception: You need to implement this method')
  }

  /**
   * Lookups the practice name based on SFDC practice name convention
   *
   * @param {String} str Practice name as in SFDC input file
   *
   * @return {String} The Micropulse convention for the practice name.
   *                  "UNKNOWN" if not found or if lookup str is null or 'undefined'
   */
  lookupPractice(str) {
    const UNKNOWN = 'UNKNOWN'
    let practice = UNKNOWN

    if (str === null || !str) {
      return UNKNOWN
    }

    const lookup = this.practices.filter(p => p.lookup.toLowerCase() === str.toLowerCase())

    if (lookup.length === 1) {
      practice = lookup[0].name
    }

    return practice
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
      const { value } = this.ws.getCell(`${this.CELLS[colunm - 1]}${row}`)

      if (value !== null) {
        values.push(value)
        colunm += 1
      } else {
        break
      }
    }
    return values
  }

  readCol(col, inRow, rowEnd) {
    const values = []
    let row = inRow

    while (row <= rowEnd) {
      const { value } = this.ws.getCell(`${this.CELLS[col - 1]}${row}`)
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
   * Returns the size of the records loaded
   *
   * @return {[type]} [description]
   */
  get size() {
    return this.records.length
  }

  /**
   * Clones records. Assumes the record have clone method.
   *
   * @return {[type]} [description]
   */
  cloneRecords() {
    const newRecords = []
    this.records.forEach((r) => {
      assert(typeof r.clone === 'function')
      newRecords.push(r.clone())
    })
    return newRecords
  }

  /**
   * Reads the report date.
   *
   * @return {Date} Report date
   */
  getReportDate() {
    const date = this.readCell(REPORT_DATE_CELL)
    if (date === null) {
      throw new Error(`Can't find report data in ${REPORT_DATE_CELL}`)
    } else {
      // SFDC reports are offset
      return new Date(`${date.trim()} UTC`)
    }
  }

  /**
   * Reads the report name from cell A!
   *
   * @return {String} The report name or "UNKNOWN REPORT NAME" if not found
   */
  getReportName() {
    const name = this.readCell(REPORT_NAME_CELL)
    return name === null ? 'UNKNOWN REPORT NAME' : name
  }

  /**
   * Number colunm values that represent 0 without explicity setting it
   * to z
   */
  static get ZERO_OR_MISSING() {
    return [null, '', '-']
  }

  /**
   * Extract the key Meta data of the parsed parsed file and return an object
   * with the following properties:
   *  name: Name of the report
   *  date: Date of the report
   *  headersRow: The row number that includes the headers (-1 if not found).
   *  firstDataRow: The row number that includes the frist data row (-1 if not found)
   *  lastDataRow: The row number that includes the last data row (-1 if not found)
   *
   * @return {Object} Files metadata object.
   */
  get meta() {
    const filterMarker = 'Filtered By:'
    const filterBlank = '   '
    const analysis = { headersRow: -1, firstDataRow: -1, lastDataRow: -1 }
    const filterRow = this.lookDown(filterMarker, 'A')

    if (filterRow !== -1) { // This is first pass for files with filters
      let result = this.lookDownCondition(c => c !== filterBlank, 'A', filterRow + 1)
      if (result.row !== -1) {
        analysis.headersRow = result.row
        analysis.firstDataRow = result.row + 1
        result = this.lookDownCondition(
          c => c === null || c.toLowerCase().startsWith('Grand Totals'.toLowerCase()),
          'A',
          analysis.firstDataRow + 1
        )
        if (result.row !== -1) {
          analysis.lastDataRow = result.row - 1
        }
      }
    } else {
      // TODO: What should we do if there is no filter?
    }

    for (const key in analysis) {
      if (analysis[key] === -1) {
        console.log('Analysis of file failed:'.red, analysis);
        throw new Error(`Analysis of file failed. Unable to detemine ${key}`)
      }
    }

    return Object.assign({},
      analysis, {
        name: this.getReportName(),
        date: this.getReportDate()
      })
  }
}
