import {
  Parser,
  Record,
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
  }

  process(data) {
    this.parser = new Parser(data)

    Object.assign(
      this.meta,
      this.analyse(), {
        name: this.parser.getReportName(),
        date: this.parser.getReportDate()
      }
    )

    const { headersRow, firstDataRow, lastDataRow } = this.meta
    const headers = this.parser.readRow(1, headersRow)
    // Read header names

    for (let i = firstDataRow; i <= lastDataRow; i += 1) {
      const record = new Record()
      const values = this.parser.readRow(1, i)
      for (let j = 0; j < values.length; j += 1) {
        record.set(headers[j], values[j])
      }
      this.list.push(record)
    }
    // Load all records

    for (let i = 0; i < headers.length; i += 1) {
      this.headers.push({
        type: AI.analyzeType(this.parser.readCol(i + 1, firstDataRow, lastDataRow)),
        header: headers[i]
      })
    }
    // Guess what type of data is stored in each col

    this.list.forEach((r) => {
      this.transform(r)
    })
    // transform records according tot the headers type
    if (this.isVerbose) {
      this.logDigest()
    }

    this.isInitialised = true
    return this
  }

  isValidHeaders(testHeaders = []) {
    return testHeaders.every(th => undefined !== this.headers.find(h => h.header === th))
  }

  transform(record) {
    Object.keys(record).forEach((header) => {
      let lookup = 'UNKNOWN'
      const type = this.getType(header)

      switch (type) {
        case 'number':
        case 'date':
          break
        case 'string':
          lookup = this.parser.lookupPractice(record.get(header))
          if (lookup !== 'UNKNOWN') {
            record.set(header, lookup)
          }
          break
        case 'currency':
          record.set(header, SH.parseNumber(record.get(header)))
          break
        case 'boolean':
          record.set(header, SH.parseBoolean(record.get(header)))
          break
        default:
          console.log(type)
          throw new Error(`Oops, UNKNOWN header type:'${type}'`)
      }
    })
  }

  getType(header) {
    const meta = this.headers.find(h => h.header === header)
    return meta === undefined ? 'UNKNOWN' : meta.type
  }

  values(header, transform = null) {
    return this.list.map((r) => {
      if (transform === null) {
        return r.get(header)
      }
      return transform(r.get(header))
    })
  }

  sort(header, data) {
    if (this.getType(header) === 'date') {
      return data.sort((a, b) => a.valueOf() - b.valueOf())
    }
    return data
    // return data.sort()
  }

  distinct(header, transform = null) {
    const data = this.sort(header, this.values(header))
    const values = []

    data.forEach((d) => {
      const transformedValue = transform === null ? d : transform(d)
      if (!values.includes(transformedValue)) {
        values.push(transformedValue)
      }
    })

    return values
  }

  analyse() {
    const filterMarker = 'Filtered By:'
    const filterBlank = '   '
    const analysis = { headersRow: -1, firstDataRow: -1, lastDataRow: -1 }
    const filterRow = this.parser.lookDown(filterMarker, 'A')

    if (filterRow !== -1) { // This is first pass for files with filters
      let result = this.parser.lookDownCondition(c => c !== filterBlank, 'A', filterRow + 1)
      if (result.row !== -1) {
        analysis.headersRow = result.row
        analysis.firstDataRow = result.row + 1
        result = this.parser.lookDownCondition(
          c => c === null || c.toLowerCase().startsWith('Grand Totals'.toLowerCase()),
          'A', analysis.firstDataRow + 1
        )
        if (result.row !== -1) {
          analysis.lastDataRow = result.row - 1
        }
      }
    } else {
      // TODO: What should we do if there is no filter?
    }

    for (const key in analysis) {
      if (analysis[key] === -1) {
        console.log('Analysis of file failed:'.red, analysis);
        throw new Error(`Analysis of file failed. Unable to detemine ${key}`)
      }
    }

    return analysis
  }

  logDigest() {
    console.log('\n[MP] Cool! %s records loaded and transformed.'.green, this.list.length)
    console.log('[MP] Detected data schme:'.grey)
    console.log(' %s %s'.bold, SH.exact('TYPE', 10), 'HEADER')
    this.headers.forEach((h) => {
      console.log(' %s %s'.grey, SH.exact(h.type, 10), h.header);
    })
  }
}
