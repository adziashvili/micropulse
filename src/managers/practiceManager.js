import { FSHelper, DateHelper } from '../common'

export default class PracticeManager {
  constructor(filePath) {
    this.pdb = JSON.parse(FSHelper.readFile(filePath))

    this.pdb.forEach((practice) => {
      practice.targets.forEach((target) => {
        if (target.month) {
          target.month = new Date(target.month)
        }
      })
    })

    this.rollupAPAC = { values: ['ANZ', 'ASEAN', 'S.KOREA', 'INDIA'], key: 'APAC' }
    this.noAPJandSharedOrder = ['ANZ', 'ASEAN', 'S.KOREA', 'INDIA', 'APAC', 'JAPAN']
  }

  getTargetIndex(monthIndex = 0) {
    if (monthIndex <= 2) return 2
    if (monthIndex <= 5) return 5
    if (monthIndex <= 8) return 8
    return 11
  }

  /**
   * Returns the pdb entry by name.
   *
   * Also, if you pass 'TOTAL', the entry with isTotal=true, will be returned.
   *
   * @param {String} name To match the entry's name (lowercase used to match)
   *
   * @return {Object} The entry in our db
   */
  getByName(name) {
    if (!name) return undefined
    return this.pdb.find(p => p.name.toLowerCase() === name.toLowerCase() ||
      (name.toLowerCase() === 'total' && p.isTotal))
  }

  /**
   * Retrives the names of all practices that are not areas.
   *
   * @return {Array} Array of practice names (strings)
   */
  get practices() {
    return this.getProperty(this.pdb.filter(p => !p.isArea))
  }

  /**
   * Retrives the names of all areas.
   *
   * @return {Array} Array of area names (strings)
   */
  get areas() {
    return this.getProperty(this.pdb.filter(p => p.isArea))
  }

  /**
   * Retrives the names of all areas and practices.
   *
   * @return {Array} Array of areas and practice names (strings)
   */
  get all() {
    return this.getProperty(this.pdb)
  }

  /**
   * Returns a property 'prop' (default is 'name') of list of db records
   * passed with 'arr'.
   *
   * @param {Array}  [arr=[]]      List of array entries
   * @param {String} [prop='name'] Property to read from each array
   *
   * @return {Array} Array of the properties read from each item.
   */
  getProperty(arr = [], prop = 'name') {
    return arr.map(a => a[prop])
  }

  /**
   * Retrives the names of all practices for a given area.
   *
   * @param {String} areaName Area name
   *
   * @return {Array} Array of objects
   */
  getAreaPractices(areaName) {
    return this.getProperty(
      this.pdb.filter(p => !p.isArea && (p.name === areaName || p.areas.includes(areaName)))
    )
  }

  getTarget(name, metric, month) {
    const targets = this.getTargets(name, metric)
    const findByIndex = (!Number.isNaN(month) && month >= 0 && month <= 11)

    if (findByIndex) {
      const targetMonthIndex = this.getTargetIndex(month)
      return targets.find(t => t.motnh.getMonth() === targetMonthIndex)
    }
    const dh = new DateHelper(month)
    return targets.find(t => dh.isSameMonth(t.motnh))
  }

  getTargets(name, metric) {
    const practice = this.getByName(name)
    if (!practice || !practice.targets) return []
    return practice.targets.filter(t => t.metric === metric)
  }

  getAnnualTargetsbyMonth(name, metric, inYear, inUpToMonthIndex = 11, isAddFY = true) {
    const NOP_TARGET = undefined
    const year = !inYear ? new Date(Date.now()).getFullYear() : inYear
    const targets = this.getTargets(name, 'bookings')
      .filter(t => t.month.getFullYear() === year)
      .map(t => ({ index: t.month.getMonth(), target: t.target }))

    const values = []
    for (let i = 0; i <= inUpToMonthIndex; i += 1) {
      const target = targets.find(t => t.index === i)
      values.push(target ? target.target : NOP_TARGET)
    }

    if ((inUpToMonthIndex) % 3 !== 2) {
      let nextQIndex = inUpToMonthIndex
      while (nextQIndex % 3 !== 2) { nextQIndex += 1 }
      const lastMonth = targets.find(t => t.index === nextQIndex)
      const lastValueIndex = values.length - 1
      values[lastValueIndex] = lastMonth ? lastMonth.target : values[lastValueIndex]
    }
    // This add the next months target to the list

    if (isAddFY) {
      const fy = targets.find(t => t.index === 11)
      values.push(fy ? fy.target : NOP_TARGET)
    }
    // This adds the annual target to the list

    return values
  }

  /**
   * Lookups an entry in the DB for a match with the SFDC array strings.
   *
   * @param {String} [sfdcLookupString=''] String to lookup
   *
   * @return {String} the name of the practice if found, 'UNKNOWN' otherwise.
   */
  lookup(sfdcLookupString = '') {
    const lookupString = (sfdcLookupString === null || !sfdcLookupString) ? '' : sfdcLookupString
    const practice = this.pdb.find(p => p.sfdc.includes(lookupString.toLowerCase()))
    return practice ? practice.name : 'UNKNOWN'
  }

  save(path) {
    if (path) {
      FSHelper.save(this.pdb, path)
    }
  }
}
