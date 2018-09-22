import { StringHelper as SH } from 'ika-helpers'
import {
  Record,
  Dictionary,
  Analyzer as AI
} from '..'

export default class Table {
  constructor(data, parser, isVerbose = false) {
    this._records = []
    this.isInitialised = false

    this.parser = parser
    this.isVerbose = isVerbose

    this.meta = this.parser.meta
    this.dictionary = this._buildDictionary()
    this._extract()
  }

  /**
   * Gets all table records.
   *
   * @return {Array} Array of objects of type Record
   */
  get records() {
    return this._records
  }

  /**
   * Filters records according to the passed filter.
   *
   * @param {[type]} [filterFunc=undefined] A filter functions that evaluates each record.
   *                                        e.g., r => r.get('a') === 5 will return all
   *                                        records that their a property equals 5
   *
   * @return {Array} All records that match the filter condition.
   *                  If filter is undefined, all recrods are returned
   */
  filterByRecord(filterFunc = undefined) {
    if (!filterFunc) return this.records
    return this.records.filter(r => filterFunc(r))
  }

  /**
   * Matches each records to ALL the filters provieded.
   * If it matches all, it is included in the returned array of records.
   *
   * @param {Array} [filters=[]]  Array of filter {key, filterFunc}.
   *                              The relevant key value is passed to each filter func.
   *                              e.g. [{'a', v => v > 1},{'b', v => v === 'IKA'} ]
   *                              will retrun all records that their a property is
   *                              greater than 1 and b property equals 'IKA'.
   *
   * @return {Array}  All records that match all filters.
   *
   *                  If filters array is empty, all records are returned.
   *
   *                  If for a specfic filter within the filters array, the key or the filterFunc are undefined,
   *                  the filter is ignored and a record is considered to be matched against the filter.
   */
  filterByValues(filters = []) {
    if (filters.length === 0) return this.records
    return this.records.filter(r => filters.every((f) => {
      if (!f.key || !f.filterFunc) return true
      return f.filterFunc(r[f.key])
    }))
  }

  /**
   * Gets all keys for this table.
   *
   * @return {Array} Array of strings, each represents a key
   */
  get keys() {
    return this.dictionary.keys
  }

  /**
   * Tests is an array of keys (strings) or a key (string) are valid keys for this table.
   *
   * @param {Array} [keys=[]] can also pass a single string representing a tested key
   *
   * @return {Boolean} True if all tested keys are valied, otherwise false.
   */
  hasKeys(keys = []) {
    return this.dictionary.exist(keys)
  }

  /**
   * Gets the type of data for a given key.
   *
   * If key is not a valid key, it returns 'UNKNOWN'.
   *
   * @param {string} key Key to get type for.
   *
   * @return {string} String representing its type.
   */
  keyType(key) {
    const dicItem = this.dictionary.find(key)
    return dicItem === undefined ? 'UNKNOWN' : dicItem.type
  }

  /**
   * Gets all value from the table for a given key.
   * Consider key as the colunm name.
   *
   * @param {String} key Key to read values for.
   * @param {Function} [transform=null] If passed, transform (value) is returned for each value
   *
   * @return {Array} Array of values for a given key
   */
  keyValues(key) {
    return this.records.map(r => r.get(key))
  }

  /**
   * Return distinct values for a given key.
   *
   * @param {String} key Key to read values for.
   * @param {Function} [transform=null] If passed, transform (value) is returned for each value
   *
   * @return {[type]} [description]
   */
  keyDistinctValues(key, transform = null) {
    const data = this.sort(key, this.keyValues(key))
    const values = []

    data.forEach((d) => {
      const transformedValue = transform === null ? d : transform(d)
      if (!values.includes(transformedValue)) {
        values.push(transformedValue)
      }
    })

    return values
  }

  /**
   * Sorts an array based on data.
   *
   * @param {String} key  The key for the data.
   * @param {Array} data array of objects or values
   *
   * @return {Array} If type of data, based on key, is date, returns a sorted array.
   *                  Otherwise, returns the data without sorting.
   */
  sort(key, data) {
    if (this.keyType(key) === 'date') {
      return data.sort((a, b) => a.valueOf() - b.valueOf())
    }
    return data
    // return data.sort()
  }

  /**
   * Processes the data received and making it ready for queries.
   *
   * It analyses the data to decide the on the meta objet.
   * It builds a dictionary that includes key and type for each colunm
   * It transforms (cleans) the values based on data type
   *
   * @param {Object} data Data that can be parsed by Parser.
   *
   * @return {Table} Reference to this.
   */
  _extract() {
    const { keys } = this.dictionary
    const { firstDataRow, lastDataRow } = this.meta

    for (let i = firstDataRow; i <= lastDataRow; i += 1) {
      const record = new Record()
      const values = this.parser.getRowValues(i)
      for (let j = 0; j < values.length; j += 1) {
        record.set(keys[j], values[j])
      }
      this.records.push(this._transform(record))
    }
    // Load all transformed records

    if (this.isVerbose) {
      this.synopsis()
    }

    this.isInitialised = true
    return this
  }

  /**
   * Transformes all values in record based on their type to the normalised value.
   * This cleans up raw data read to cleaned data we can work with where e.g.
   *  boolean will be either true of false
   *  date will be a valid date object etc...
   *
   * @param {Record} record Record to transform
   *
   * @return {Record} Transformed record.
   */
  _transform(record) {
    Object.keys(record).forEach((key) => {
      let lookup = 'UNKNOWN'
      const type = this.keyType(key)

      switch (type) {
        case 'number':
        case 'date':
          break
        case 'string':
          lookup = this.parser.lookup(record.get(key))
          if (lookup !== 'UNKNOWN') {
            record.set(key, lookup)
          }
          break
        case 'currency':
          record.set(key, SH.parseNumber(record.get(key)))
          break
        case 'boolean':
          record.set(key, SH.parseBoolean(record.get(key)))
          break
        default:
          throw new Error(`Oops, UNKNOWN key type:'${type}'`)
      }
    })

    return record
  }

  /**
   * Builds the dictionary for underlying data.
   * Based on meta.headersRow reds the headers from data and populates
   * the dictionary with {key, type}.
   *  key is the value read from the Data
   *  type is the type of data as guessed by Analyzer
   *
   * @return {Array} Keys all all entries in the built dictionary
   */
  _buildDictionary() {
    const dictionary = new Dictionary()
    const headers = this.parser.getHeaderNames()

    for (let i = 0; i < headers.length; i += 1) {
      dictionary.set({
        key: headers[i],
        type: AI.guessType(this.parser.getColValues(i))
        // Guess what type of data is stored in each col
      })
    }

    return dictionary
  }

  /**
   * Prints a simple report aboud the data processed recordsing type and key.
   *
   * @return {Nothing} undefined
   */
  synopsis() {
    console.log('\n[MP] Cool! %s records loaded and transformed.'.green, this.records.length)
    console.log('[MP] Detected data schme:'.grey)
    console.log(' %s %s'.bold, SH.exact('TYPE', 10), 'KEY')

    this.dictionary.forEach((h) => {
      console.log(' %s %s'.grey, SH.exact(h.type, 10), h.key);
    })
  }
}
