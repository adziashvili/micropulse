import { MicroPulse } from './reports'
import { PracticeManager } from './managers'

require('colors')

function start() {
  const practiceDBPath = './data/practiceDb.json'
  const pm = new PracticeManager(practiceDBPath)
  // const names = pm.all // Helps to order so APAC names comes first.
  // const REPORT_DATE = new Date('8/31/2018 23:59:59 GMT-7') // Reports cut off date

  console.clear()
  // const sm = new StoreManager(pm)
  // sm.buildAll(names, REPORT_DATE) // build all the data models

  const isVerbose = false

  const mp = new MicroPulse(pm)
  mp.run(isVerbose)
    .then(() => {
      console.log('MicroPulse - success.'.green)
    }).catch((err) => {
      console.log('MicroPulse - failed.'.red)
      console.log(err)
    }).finally(() => {
      console.log('MicroPulse - done.'.grey.italic)
    })
}

start()
