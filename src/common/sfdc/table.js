import {
  Parser,
  Record,
  Dictionary,
  StringHelper as SH,
  Analyzer as AI
} from '..'

export default class Table {
  constructor(isVerbose = false) {
    this.isVerbose = isVerbose
    this.headers = []
    this.list = []
    this.parser = null
    this.meta = {}
    this.dictionary = new Dictionary()
  }

  process(data) {
    this.parser = new Parser(data)
    this.meta = this.parser.meta
    const keys = this.setupDictionary()

    const { firstDataRow, lastDataRow } = this.meta

    for (let i = firstDataRow; i <= lastDataRow; i += 1) {
      const record = new Record()
      const values = this.parser.readRow(1, i)
      for (let j = 0; j < values.length; j += 1) {
        record.set(keys[j], values[j])
      }
      this.list.push(this.transform(record))
    }
    // Load all transformed records

    if (this.isVerbose) {
      this.logDigest()
    }

    this.isInitialised = true
    return this
  }

  setupDictionary() {
    const { headersRow, firstDataRow, lastDataRow } = this.meta
    const headers = this.parser.readRow(1, headersRow)

    for (let i = 0; i < headers.length; i += 1) {
      this.dictionary.set({
        key: headers[i],
        type: AI.guessType(this.parser.readCol(i + 1, firstDataRow, lastDataRow))
        // Guess what type of data is stored in each col
      })
    }

    return this.dictionary.keys
  }

  isValidHeaders(testHeaders = []) {
    return this.dictionary.exist(testHeaders)
  }

  transform(record) {
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

  getType(key) {
    const dicItem = this.dictionary.find(key)
    return dicItem === undefined ? 'UNKNOWN' : dicItem.type
  }

  values(key, transform = null) {
    return this.list.map((r) => {
      const value = r.get(key)
      if (transform === null) return value
      return transform(value)
    })
  }

  sort(key, data) {
    if (this.getType(key) === 'date') {
      return data.sort((a, b) => a.valueOf() - b.valueOf())
    }
    return data
    // return data.sort()
  }

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

  logDigest() {
    console.log('\n[MP] Cool! %s records loaded and transformed.'.green, this.list.length)
    console.log('[MP] Detected data schme:'.grey)
    console.log(' %s %s'.bold, SH.exact('TYPE', 10), 'HEADER')

    this.dictionary.forEach((h) => {
      console.log(' %s %s'.grey, SH.exact(h.type, 10), h.key);
    })
  }
}
