import {
  StringBuffer,
  ReportHelper,
  DateHelper,
  StringHelper as SH
} from 'ika-helpers'

export default class TableReporter {
  constructor(array = [], {
    title,
    filterBeforeSort,
    sortBy,
    filterAfterSort,
    displayKeys,
    headers = [],
    types = [],
    padding = '',
    colounmSpaceCount = 3,
    summeriser = undefined
  } = {}) {
    this.array = array
    this.title = title
    this.filterBeforeSort = filterBeforeSort
    this.sortBy = sortBy
    this.filterAfterSort = filterAfterSort
    this.displayKeys = displayKeys
    this.headers = headers
    this.types = types
    this.padding = padding
    this.colounmSpaceCount = colounmSpaceCount
    this.summeriser = summeriser

    this.rh = new ReportHelper()
  }

  report() {
    if (!Array.isArray(this.array)) return

    const {
      array,
      rh,
      title,
      filterBeforeSort,
      sortBy,
      filterAfterSort,
      displayKeys,
      headers,
      padding
    } = this

    rh.newLine()
    rh.add(padding + title.cyan)

    let records = !filterBeforeSort ? array.slice() : array.filter(filterBeforeSort)
    if (sortBy) records.sort(sortBy)
    records = !filterAfterSort ? records : records.filter(filterAfterSort)

    const values = []
    const isHeaders = headers.length > 0

    if (isHeaders) {
      const entry = ['#']
      headers.forEach(h => entry.push(h))
      values.push(entry)
    }

    records.forEach((r, i) => {
      const position = i + 1
      const entry = [`${position}`]
      displayKeys.forEach(key => entry.push(this.format(key, r.get(key))))
      values.push(entry)
    })

    const lengths = this.getMaxStringLengths(values)
    values.forEach((entry, entryIndex) => {
      const sb = new StringBuffer(padding)
      entry.forEach((value, i) => sb.appendExact(`${value}`, lengths[i]))
      console.log(isHeaders && entryIndex === 0 ? sb.toString().dim : sb.toString());
    })

    if (this.summeriser) {
      this.summeriser.array = records
      this.summeriser.padding = padding
      this.summeriser.report()
    }
  }

  getMaxStringLengths(objects) {
    const keyCount = this.displayKeys.length + 1
    const lengths = []

    for (let i = 0; i < keyCount; i += 1) {
      const objLengths = []
      for (let j = 0; j < objects.length; j += 1) {
        objLengths.push(`${objects[j][i]}`.length + this.colounmSpaceCount)
      }
      lengths.push(Math.max(...objLengths))
    }

    return lengths
  }

  keyType(key) {
    // console.log(this.types);
    const index = this.displayKeys.findIndex(dk => dk === key)
    if (index >= 0 && index < this.types.length - 1) {
      return this.types[index]
    }
    return 'string'
  }

  format(key, value) {
    const type = this.keyType(key)
    const v = type === 'date' ? new Date(value) : value

    return this.defaultFormatList(v, type)
  }

  defaultFormatList(value, type = 'string') {
    switch (type) {
      case 'currency':
        return `$${SH.toThousands(value)}`
      case 'percent':
        return SH.toPercent(value)
      case 'date':
        return new DateHelper(value).shortDate
      case 'number':
        return SH.toNumber(value)
      case 'string':
      case 'boolean':
      default:
        return value
    }
  }
}
