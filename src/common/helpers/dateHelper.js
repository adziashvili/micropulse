const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

/**
 * Utility class to easily obtain common date functionality and properties.
 */
export default class DateHelper {
  /**
   * Parses date to Date object.
   *
   * @param {Any} date Can pass on Date or string representing a date.
   *
   * @return {[type]} Null if date is not a string and not a Date object
   *                  Null if date is an invalid instance of Date (tested with date.valueOf())
   *                  Date if date is succesfully evalued to a Date object
   */
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

  /**
   * Return month name as a 3 character lenght string e.g. Jan
   *
   * @return {Stirng} e.g. Feb
   */
  static getMonthName(month) {
    return monthNames[month]
  }

  /**
   * Retrun formated month-year string for a given date.
   *
   * @param {Date}  date                Date to format
   * @param {Boolean} [isShortYear=false] If true uses two digits for year, otherwise 4
   *
   * @return {String}  Formated month-year string. e.g. Jan 18
   */
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

  /**
   * @param {Date} date Date
   */
  constructor(date) {
    this.date = date
  }

  /**
   * Formats date according to the following config:
   *
   * hourCycle: 'h24',
   * weekday: 'short',
   * year: 'numeric',
   * month: 'long',
   * day: '2-digit',
   * hour: '2-digit',
   * minute: '2-digit',
   * second: '2-digit',
   * timeZoneName: 'short'
   *
   * @return {[type]} [description]
   */
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

  /**
   * Return short date dd-mmm-yyyy
   *
   * @return {String} e.g. 01-Jan-2018
   */
  get shortDate() {
    const day = this.day < 10 ? `0${this.day}` : this.day
    return `${day}-${this.monthName}-${this.year}`
  }

  /**
   * Return the date day in a month.
   *
   * @return {Number} Day in month e.g. 31
   */
  get day() {
    return this.date.getDate()
  }

  /**
   * Returns the year of date.
   *
   * @return {Number} Full year (yyyy), e.g. 2018
   */
  get year() {
    return this.date.getFullYear()
  }

  /**
   * Return month name as a 3 character lenght string e.g. Jan
   *
   * @return {Stirng} e.g. Feb
   */
  get monthName() {
    return monthNames[this.date.getMonth()]
  }

  /**
   * Return string concatenation of month name and full year.
   *
   * @return {String} e.g. Jan 2018
   */
  get monthYear() {
    return `${this.monthName} ${this.year}`
  }

  /**
   * Return true if the date provided to DateHelper
   * occures in the same month as today.
   *
   * @return {Boolean} true if month is same as today's month
   */
  get isNew() {
    const today = new Date(Date.now())
    return this.date.getMonth() === today.getMonth() - 1
  }

  /**
   * Tests if the date used by DateHelper is in the past.
   *
   * @param {Number} [addMoreMonths=0]  Add addMoreMonths months to the data
   *                                    months count and then tests agasint today's
   *                                    motnhs count.
   *
   * @return {Boolean} Date months count is lower than todays months count.
   */
  isPast(addMoreMonths = 0) {
    const today = new Date(Date.now())
    const dateInMonths = (this.date.getFullYear() - 1) * 12 + addMoreMonths
    const todayInMonths = (today.getFullYear() - 1) * 12 + today.getMonth()

    return dateInMonths < todayInMonths
  }

  /**
   * Tests current DateHelper date for same year and same month against a new date
   *
   * @param {Date} date Date to test agasint
   *
   * @return {Boolean} true if the same year and same month, false otherwise
   */
  isSameMonth(date) {
    return this.isSameYear(date) && this.date.getMonth() === date.getMonth()
  }

  /**
   * Tests current DateHelper date for same year against a new date
   *
   * @param {Date} date Date to test agasint
   *
   * @return {Boolean} true if the same year, false otherwise
   */
  isSameYear(date) {
    return this.date.getFullYear() === date.getFullYear()
  }

  /**
   * Gets the date object used by DateHelper
   *
   * @return {Date} Date object
   */
  get date() {
    return this._date
  }

  /**
   * Sets date to the DateHelper instance.
   *
   * @param {Date} New date to use
   *
   * @return {Nothing} undefined
   */
  set date(d) {
    const tmpDate = DateHelper.parse(d)
    if (tmpDate === null) {
      console.log('%s is an invalid date'.red, d);
      throw new Error('Invalid date or date string')
    }
    this._date = tmpDate
  }
}
