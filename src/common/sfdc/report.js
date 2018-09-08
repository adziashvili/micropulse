import {
  ExcelReader,
  Modeler,
  Table,
  Reporter
} from '..'

export default class Report {
  constructor({
    file = undefined,
    dictionary = undefined,
    firstColShrinkBy = 0,
    otherColShrinBy = 0,
    isAddTotal = true,
    isAddTotalRow = true,
    isRepeatHeaders = false,
    listConfig = undefined
  } = {}) {
    this.file = file
    this.dictionary = dictionary

    this.cols = []
    this.rows = []
    this.stats = []
    this.custom = []

    // default settings
    this.firstColShrinkBy = firstColShrinkBy
    this.otherColShrinBy = otherColShrinBy
    this.isAddTotal = isAddTotal
    this.isAddTotalRow = isAddTotalRow
    this.isRepeatHeaders = isRepeatHeaders

    // default list settings
    this.listConfig = listConfig
  }

  verifySelf() {
    if (!this.file) {
      console.log("Error: can't run the report without a 'file' property");
      return false
    }

    return true
  }

  run(isVerbose = false) {
    if (!this.verifySelf()) {
      throw new Error('Invalid report subclassing. Check log.')
    }

    return ExcelReader
      .load(this.file)
      .then(data => new Table().process(data.getWorksheet(data.worksheets[0].id)))
      .then((table) => {
        const modeler = new Modeler(table)
        const keys = ['cols', 'rows', 'stats', 'custom']
        keys.forEach((key) => {
          if (this[key].length > 0) {
            modeler[key] = this[key]
          }
        })
        modeler.build()
        return modeler
      })
      .then((modeler) => {
        const config = {
          modeler,
          dictionary: this.dictionary,
          isAddTotal: this.isAddTotal,
          isAddTotalRow: this.isAddTotalRow,
          isRepeatHeaders: this.isRepeatHeaders,
          firstColShrinkBy: this.firstColShrinkBy,
          otherColShrinBy: this.otherColShrinBy,
          listConfig: this.listConfig,
          isVerbose
        }
        return new Reporter(config)
      })
      .then(reporter => reporter.report(isVerbose))
      .catch((e) => {
        e.message = `'Reporter Ooops! ${e.message}`.red.bold
        throw e // rejects the promise to report
      })
  }
}
