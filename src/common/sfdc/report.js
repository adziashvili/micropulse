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
        const reporter = new Reporter(modeler)

        if (this.dictionary) {
          reporter.dictionary = this.dictionary
        }

        return reporter
      })
      .then((reporter) => {
        reporter.report(isVerbose)
      })
      .catch((e) => {
        console.log('Ooops! We have an error'.red);
        console.log(e)
        throw e
      })

    return Promise.resolve(true)
  }
}
