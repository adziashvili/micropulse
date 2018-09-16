import {
  UtilizationPulse,
  MicroPulse
} from './reports'

import { StoreManager, PracticeManager } from './managers'

require('colors')

function start() {
  const practiceDBPath = './data/practiceDb.json'
  const pm = new PracticeManager(practiceDBPath)
  const names = pm.all // Helps to order so APAC names comes first.
  const REPORT_DATE = new Date('8/31/2018 23:59:59 GMT-7') // Reports cut off date

  console.clear()
  const sm = new StoreManager(pm)
  sm.buildAll(names, REPORT_DATE) // build all the data models

  const isVerbose = false

  const mp = new MicroPulse(sm)
  mp.report(isVerbose)
}

start()

// Promise.resolve(true)
//   .then(new UtilizationPulse(sm, REPORT_DATE).run(isVerbose))
//   .then(sm.save())
//   .catch(e => console.log(e))

// Runs pulse reports
