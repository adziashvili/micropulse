const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

/**
 * Helper function for quick date functions
 */
export default class DateHelper {
  static parse(date) {
    if (date instanceof Date) {
      if (Number.isNaN(date.valueOf())) {
        // invalid date object
        return null
      }
      return date
    }
    if (typeof date === 'string') {
      const ms = Date.parse(date)
      if (!Number.isNaN(ms)) {
        return new Date(ms)
      }
    }
    return null
  }

  static getMonthName(month) {
    return monthNames[month]
  }

  static getMonthYear(date, isShortYear = false) {
    const year = !isShortYear ? date.getFullYear() : `${date.getFullYear()}`.slice(2)
    return `${monthNames[date.getMonth()]} ${year}`
  }

  /**
   * Calculates the min date and max date in an array of objects.
   *
   * @param {Array}  [objArray=[]] Array of objects to scan
   * @param {String} [dateProp=''] The propery in the objects that holds the date prop
   *
   * @return {[type]} Object with two properties minDate and maxDate.
   *                  If objArray is not an array with size > 0 or if
   *                  objProp is not a string {null, null} is returned.
   */
  static getMinMaxDates(objArray = [], dateProp = '') {
    const dates = {
      minDate: null,
      maxDate: null
    }

    if (typeof dateProp !== 'string' || !Array.isArray(objArray) || objArray.length === 0) {
      return null
    }

    dates.minDate = objArray[0][dateProp]
    dates.maxDate = objArray[0][dateProp]

    objArray.forEach((obj) => {
      if (obj[dateProp].valueOf() < dates.minDate.valueOf()) {
        dates.minDate = obj[dateProp]
      }
      if (obj[dateProp].valueOf() > dates.maxDate.valueOf()) {
        dates.maxDate = obj[dateProp]
      }
    })

    return dates
  }

  constructor(date) {
    this.date = date
  }

  get localeDateString() {
    const options = {
      hourCycle: 'h24',
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }

    return this.date.toLocaleDateString('en-US', options)
  }

  get monthYear() {
    return `${this.monthName} ${this.year}`
  }

  get year() {
    return this.date.getFullYear()
  }

  get isNew() {
    const today = new Date(Date.now())
    return this.date.getMonth() === today.getMonth() - 1
  }

  isPast(addMoreMonths = 0) {
    const today = new Date(Date.now())
    const dateInMonths = (this.date.getFullYear() - 1) * 12 + addMoreMonths
    const todayInMonths = (today.getFullYear() - 1) * 12 + today.getMonth()

    return dateInMonths < todayInMonths
  }

  isSameMonth(date) {
    return this.isSameYear(date) && this.date.getMonth() === date.getMonth()
  }

  isSameYear(date) {
    return this.date.getFullYear() === date.getFullYear()
  }

  get monthName() {
    return monthNames[this.date.getMonth()]
  }

  get day() {
    return this.date.getDate()
  }

  get shortDate() {
    return `${this.day}-${this.monthName}-${this.year}`
  }

  get date() {
    return this._date
  }

  set date(d) {
    const tmpDate = DateHelper.parse(d)
    if (tmpDate === null) {
      console.log('%s is an invalid date'.red, d);
      throw new Error('Invalid date or date string')
    }
    this._date = tmpDate
  }
}
