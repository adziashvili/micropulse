import {
  UtilizationRecord
} from '.'

const assert = require('assert')

const CELLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M']

const NOT_FOUND = -1

const DATES_ROW_MARKER = 'Resource Practice'
const REPORT_DATE_CELL = 'A6'
const UTILIZATION_DATA_FIRST_COL = 3

export default class UtilizationReader {
  constructor() {
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

    this.records = []
    this.ws = null
  }

  /**
   * Processes the worksheet that was read.
   * Populates records as read from the excel.
   *
   * @param {[type]} worksheet The raw worksheet that was read.
   *
   * @return {Void} Nothing.
   */
  loadRecords(worksheet) {
    this.ws = worksheet

    const dates = this.readValues(
      UTILIZATION_DATA_FIRST_COL,
      this.getAnchorRow(DATES_ROW_MARKER)
    )

    dates[dates.length - 1] = dates[dates.length - 2]

    this.practices.forEach((practice) => {
      practice.row = this.getAnchorRow(practice.lookup)

      if (NOT_FOUND === practice.row) {
        return
      }

      practice.billable = this.readValues(
        UTILIZATION_DATA_FIRST_COL,
        practice.row
      )

      practice.investment = this.readValues(
        UTILIZATION_DATA_FIRST_COL,
        practice.row + 1
      )

      const periods = dates.length

      assert(periods === practice.billable.length)
      assert(periods === practice.investment.length)

      for (let i = 0; i < periods - 1; i += 1) {
        this.records.push(
          new UtilizationRecord(
            UtilizationRecord.TYPE_MONTHLY,
            practice.name,
            dates[i],
            practice.billable[i],
            practice.investment[i]
          )
        )
      }

      this.records.push(
        new UtilizationRecord(
          UtilizationRecord.TYPE_YTD,
          practice.name,
          dates[periods - 1],
          practice.billable[periods - 1],
          practice.investment[periods - 1]
        )
      )
    })
  }

  /**
   * Calculates and returns the size of reocrds.
   * This is similar to this.records.length.
   *
   * @return {Number} Length of records read from excel
   */
  get size() {
    return this.records.length
  }

  /**
   * Return a new copy of read records. This new copy can be freely manipulated.
   *
   * @return {Array} Array copy of records
   */
  cloneRecords() {
    const newRecords = []
    this.records.forEach((r) => {
      newRecords.push(r.clone())
    })
    return newRecords
  }

  /**
   * Reads all values from col at row till it hits a null.
   *
   * @param {Number} col colounm to start from
   * @param {Number} row Row to read
   *
   * @return {[type]} [description]
   */
  readValues(inCol, row) {
    let col = inCol
    const values = []
    const forever = true

    while (forever) {
      const { value } = this.ws.getCell(`${CELLS[col - 1]}${row}`)
      if (value !== null) {
        values.push(value)
        col += 1
      } else {
        break
      }
    }
    return values
  }

  /**
   * Captures the row numbers for each practice
   *
   * @param {[type]} practice [description]
   *
   * @return {[type]} [description]
   */
  getAnchorRow(lookup) {
    let row = 1
    const forever = true
    while (forever) {
      let { value } = this.ws.getCell(`A${row}`)
      if (value === null || !value) {
        value = ''
      }
      if (value.toLowerCase() === lookup.toLowerCase()) {
        return row
      }

      row += 1
      if (row > 100) {
        return NOT_FOUND
      }
    }

    return row
  }

  /**
   * Reads a cell value
   *
   * @param {String} cell e.g. A7
   *
   * @return {any} As read from the file
   */
  readCell(cell) {
    return this.ws.getCell(cell)
      .value
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
    }

    const tokens1 = date.split('/')
    const tokens2 = tokens1[2].split(' ')

    return new Date(tokens2[0], tokens1[0] - 1, tokens1[1])
  }
}
