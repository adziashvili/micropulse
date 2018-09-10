import {
  Record,
  Dictionary,
  StringHelper as SH,
  Analyzer as AI
} from '..'

export default class Table {
  constructor(data, Parser, isVerbose = false) {
    this.parser = new Parser(data)
    this.isVerbose = isVerbose

    this.isInitialised = false
    this.meta = this.parser.meta
    this.dictionary = this.buildDictionary()
    this.list = []

    this.process()
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
  process() {
    const { keys } = this.dictionary
    const { firstDataRow, lastDataRow } = this.meta

    for (let i = firstDataRow; i <= lastDataRow; i += 1) {
      const record = new Record()
      const values = this.parser.readRow(1, i)
      for (let j = 0; j < values.length; j += 1) {
        record.set(keys[j], values[j])
      }
      this.list.push(this.transformRecord(record))
    }
    // Load all transformed records

    if (this.isVerbose) {
      this.logDigest()
    }

    this.isInitialised = true
    return this
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
  buildDictionary() {
    const dictionary = new Dictionary()

    const { headersRow, firstDataRow, lastDataRow } = this.meta
    const headers = this.parser.readRow(1, headersRow)

    for (let i = 0; i < headers.length; i += 1) {
      dictionary.set({
        key: headers[i],
        type: AI.guessType(this.parser.readCol(i + 1, firstDataRow, lastDataRow))
        // Guess what type of data is stored in each col
      })
    }

    return dictionary
  }

  /**
   * Tests is an array of keys (strings) or a key (string) are valid keys for this table.
   *
   * @param {Array} [keys=[]] can also pass a single string representing a tested key
   *
   * @return {Boolean} True if all tested keys are valied, otherwise false.
   */
  isValidKeys(keys = []) {
    return this.dictionary.exist(keys)
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
  transformRecord(record) {
    Object.keys(record).forEach((key) => {
      let lookup = 'UNKNOWN'
      const type = this.getType(key)

      switch (type) {
        case 'number':
        case 'date':
          break
        case 'string':
          lookup = this.parser.lookupPractice(record.get(key))
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
   * Sorts an array based on data.
   *
   * @param {String} key  The key for the data.
   * @param {Array} data array of objects or values
   *
   * @return {Array} If type of data, based on key, is date, returns a sorted array.
   *                  Otherwise, returns the data without sorting.
   */
  sort(key, data) {
    if (this.getType(key) === 'date') {
      return data.sort((a, b) => a.valueOf() - b.valueOf())
    }
    return data
    // return data.sort()
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
  getType(key) {
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
  values(key, transform = null) {
    return this.list.map((r) => {
      const value = r.get(key)
      if (transform === null) return value
      return transform(value)
    })
  }

  /**
   * Return distinct values for a given key.
   *
   * @param {String} key Key to read values for.
   * @param {Function} [transform=null] If passed, transform (value) is returned for each value
   *
   * @return {[type]} [description]
   */
  distinct(key, transform = null) {
    const data = this.sort(key, this.values(key))
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
   * Prints a simple report aboud the data processed listing type and key.
   *
   * @return {Nothing} undefined
   */
  logDigest() {
    console.log('\n[MP] Cool! %s records loaded and transformed.'.green, this.list.length)
    console.log('[MP] Detected data schme:'.grey)
    console.log(' %s %s'.bold, SH.exact('TYPE', 10), 'KEY')

    this.dictionary.forEach((h) => {
      console.log(' %s %s'.grey, SH.exact(h.type, 10), h.key);
    })
  }
}
