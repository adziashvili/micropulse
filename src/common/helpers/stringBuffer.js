import { StringHelper as SH } from '..'

export default class StringBuffer {
  constructor(str) {
    this._buffer = []
    if (str) {
      this._buffer.push(str)
    }
  }

  append(s = '') {
    this._buffer.push(s)
    return this
  }

  appendTimes(str, times = 1) {
    for (let i = 0; i < times; i += 1) {
      this.append(str)
    }
    return this
  }

  appendPad(str, len) {
    return this.append(SH.prefix(str, len))
  }

  appendExact(str, len) {
    return this.append(SH.exact(str, len))
  }

  newLine() {
    return this.append('\n')
  }

  toString() {
    let str = ''
    this._buffer.forEach((s) => {
      str += s
    })
    return str
  }
}
