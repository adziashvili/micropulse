export default class Record {
  exist(key) {
    return Object.keys(this).includes(key)
  }

  set(key, value) {
    this[key] = value
  }

  get(key) {
    return this[key]
  }
}
