import BaseExcelParser from './baseExcelParser'

const REPORT_NAME_CELL = 'A1'
const REPORT_DATE_CELL = 'A6'

export default class SFDCExcelParser extends BaseExcelParser {
  constructor(ws) {
    super(ws)
    this.lookups = [
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

  /**
   * Reads the report date.
   *
   * @return {Date} Report date
   */
  getReportDate() {
    const date = this.readCell(REPORT_DATE_CELL)
    if (date === null) {
      throw new Error(`Can't find report date in ${REPORT_DATE_CELL}`)
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
  parseMeta() {
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
    }

    return Object.assign({},
      analysis, {
        name: this.getReportName(),
        date: this.getReportDate()
      })
  }
}
