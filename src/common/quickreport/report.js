import { ExcelReader } from 'ika-helpers'
import {
  ParserFactory,
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

    this.isReady = false
    this.config = {}
  }

  verifySelf() {
    if (!this.file) {
      console.log("Error: can't run the report without a 'file' property");
      return false
    }
    return true
  }

  /**
   * Setup for all that is required to run a report.
   *
   * Return value includes:
   *  table: The table instance used to feed modeler
   *  modeler: The build Modeler intance
   *  reporterConfig: The config used to feed reporter
   *  reporter: Intance of a Reporter used for the report
   *  result: The result of running the report.
   *
   * @param {Boolean} [isVerbose=false] Prints verbose if true
   *
   * @return {Object}  Return the various building blocks used to
   *                   build this report.
   */
  configure() {
    if (!this.verifySelf()) {
      throw new Error('Invalid report subclassing. Check log.')
    }

    return ExcelReader
      .load(this.file)
      .then((data) => {
        const ws = data.getWorksheet(data.worksheets[0].id)
        const parser = ParserFactory.getParser(ws)
        if (!parser) {
          throw new Error('Unable to find a suitable parser')
        }
        return { ws, parser }
      })
      .then(result => ({ table: new Table(result.ws, result.parser) }))
      .then((config) => {
        const modeler = new Modeler(config.table)
        const keys = ['cols', 'rows', 'stats', 'custom']
        keys.forEach((key) => {
          if (this[key].length > 0) {
            modeler[key] = this[key]
          }
        })
        modeler.build()
        config.modeler = modeler
        return config
      })
      .then((config) => {
        const reporterConfig = {
          modeler: config.modeler,
          dictionary: this.dictionary,
          isAddTotal: this.isAddTotal,
          isAddTotalRow: this.isAddTotalRow,
          isRepeatHeaders: this.isRepeatHeaders,
          firstColShrinkBy: this.firstColShrinkBy,
          otherColShrinBy: this.otherColShrinBy,
          listConfig: this.listConfig
        }
        return Object.assign(config, {
          reporterConfig,
          reporter: new Reporter(reporterConfig)
        })
      })
      .then((config) => {
        this.config = config
        this.isReady = true
        return this.config
      })
      .catch((e) => {
        e.message = `'Ooops! We failed to setup the report - ${e.message}`.red.bold
        throw e // rejects the promise to report
      })
  }

  /**
   * Runs a report.
   *
   * Return value includes:
   *  table: The table instance used to feed modeler
   *  modeler: The build Modeler intance
   *  reporterConfig: The config used to feed reporter
   *  reporter: Intance of a Reporter used for the report
   *  result: The result of running the report.
   *
   * @param {Boolean} [isVerbose=false] Prints verbose if true
   *
   * @return {Object}  Return the various building blocks used to
   *                   build this report.
   */
  report(isVerbose = false) {
    if (!this.isReady) {
      console.log('Report is not ready.');
      return {}
    }
    const { config } = this
    return Object.assign(config, { result: config.reporter.report(isVerbose) })
  }
}
