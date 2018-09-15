import { UtilizationPulse, UtilizationPulseNew } from './modules/utilization'
import { PipelinePulse, PipelinePulseNew } from './modules/pipeline'
import { BookingsPulse } from './modules/bookings'
import { StoreManager, PracticeManager } from './managers'

require('colors')

const practiceDBPath = './data/practiceDb.json'

const pm = new PracticeManager(practiceDBPath)
const names = pm.all
// Used to force a specific order on the reports so APAC names comes first.

const REPORT_DATE = new Date('8/31/2018 23:59:59 GMT-7')
// A date for the reporting cut off

console.clear()
// Clenaing the concole before outputing the report

const sm = new StoreManager(pm)
// // Loads the data manager

sm.buildAll(names, REPORT_DATE)
// // Asks the store manager to build all the data models

const isVerbose = false
const bookingsYTD = './data/bookingsYTD.xlsx'
const pipelineYTD = './data/pipelineYTD.xlsx'
const pipeline6Months = './data/pipeline6months.xlsx'
const utilizationYTD = './data/utilizationYTD.xlsx'

// Promise.resolve(true)
//   .then(new UtilizationPulse(sm, REPORT_DATE).run(isVerbose))
//   .then(new PipelinePulse(sm, REPORT_DATE).run(isVerbose))
//   .then(sm.save())
//   .catch(e => console.log(e))

const analyzePipelinePromise = new PipelinePulseNew(pipelineYTD, sm).run(isVerbose)
analyzePipelinePromise
  .then(config => new BookingsPulse(bookingsYTD, sm, config.result).run(isVerbose))
  .then(new UtilizationPulseNew(utilizationYTD, sm).run(isVerbose))
  .then(new PipelinePulseNew(pipeline6Months, sm).run(isVerbose))
  .catch(e => console.log(e))


// Runs pulse reports
