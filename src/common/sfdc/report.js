import {
  ExcelReader,
  Modeler,
  Table,
  Reporter
} from '..'

export default class Report {
  constructor() {
    this.file = undefined
    this.dictionary = undefined
    this.cols = []
    this.rows = []
    this.stats = []
    this.custom = []

    // default settings
    this.firstColShrinkBy = 0
    this.otherColShrinBy = 0
    this.isAddTotal = true
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

    ExcelReader
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
        const reporter = new Reporter(modeler, this.isAddTotal, isVerbose)

        if (this.dictionary) {
          reporter.dictionary = this.dictionary
        }
        // assign dictionary if we have one

        const { layout } = reporter
        layout.firstColShrinkBy = this.firstColShrinkBy
        layout.otherColShrinBy = this.otherColShrinBy
        // adjust layout if needed

        return reporter
      })
      .then((reporter) => {
        reporter.report(isVerbose)
        return Promise.resolve(true)
      })
      .catch((e) => {
        e.message = `'Reporter Ooops! ${e.message}`.red.bold
        throw e // rejects the promise to report
      })
  }
}
