import { StringHelper, StringBuffer } from 'ika-helpers'

export default class Verbatim {
  constructor(data = [], { isUnstyle = true, isTrim = true } = {}) {
    this.data = data

    if (isUnstyle) {
      this.unstyle()
    }

    if (isTrim) {
      this.trim()
    }
  }

  get colCount() {
    if (this.data.length === 0) return 0
    return this.data[0].length
  }

  unstyle() {
    this.transform((v) => {
      if (StringHelper.isStyled(v)) {
        return `${v.strip}`
      }
      return v
    })
  }

  trim() {
    this.transform((v) => {
      if (typeof v === 'string') {
        return v.trim()
      }
      return v
    })
  }

  transform(transformer = undefined) {
    if (transformer === undefined) return
    this.data.forEach((array) => {
      for (let i = 0; i < array.length; i += 1) {
        array[i] = transformer(array[i])
      }
    })
  }

  log() {
    this.data.forEach((array) => {
      const sb = new StringBuffer()
      for (let i = 0; i < array.length; i += 1) {
        sb.append(array[i])
      }
      console.log(sb.toString());
    })
  }

  find(key, fromIndex = 0) {
    if (fromIndex < 0) return undefined
    const searchArray = this.data.slice(fromIndex)
    return searchArray.find(row => row.length > 0 && row[0] === key)
  }

  findAfter(key, afterKey) {
    const afterIndex = this.data.findIndex(row => row.length > 0 && row[0] === afterKey)
    return this.find(key, afterIndex)
  }
}
