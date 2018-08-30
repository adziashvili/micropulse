const Excel = require('exceljs')

/**
 * Simple Excel JS Wrapper.
 *
 * @type {Excel}
 */
export default class ExcelReader {
  /**
   * Returns a promise to read a file.
   *
   * @param {String} file Path to file
   *
   * @return {Object} Promise to read the excel.
   *                  When Resolved, returns the workbook.
   *                  See https://www.npmjs.com/package/exceljs#reading-xlsx
   */
  static load(file) {
    const wb = new Excel.Workbook()
    return wb.xlsx.readFile(file)
  }
}
