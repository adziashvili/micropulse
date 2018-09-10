export default class Dictionary {
  constructor(dic = []) {
    this._dic = []
    this.add(dic)
  }

  get dic() {
    return this._dic
  }

  add(dictionary = []) {
    let inDictionary = dictionary

    if (dictionary instanceof Dictionary) {
      inDictionary = dictionary.dic
    }

    inDictionary.forEach((item) => {
      this.set(item)
    })
    return this
  }

  find(key) {
    return this.dic.find(item => item.key === key)
  }

  /**
   * Tests to see if a set of keys or a key are in the dictionary
   * by matching their key property to the ones stored in the dictionary instance.
   *
   * @param {String or Array of Strings} key key or keys to test
   *
   * @return {Boolean} True if all keys exist in the dictionary.
   */
  exist(key) {
    return Array.isArray(key) ?
      key.every(k => !!this.find(k)) :
      !!this.find(key)
  }

  get(key, prop = 'shortName') {
    const item = this.find(key)
    if (!item || !Object.keys(item).includes(prop)) {
      return key
    }
    return item[prop]
  }

  get keys() {
    return this.dic.map(item => item.key)
  }

  set(dicObj) {
    if (!dicObj || !dicObj.key) {
      console.log('Invalid dictionary item. Ignored'.yellow, dicObj);
    }

    const index = this.dic.findIndex(item => item.key === dicObj.key)

    if (index === -1) {
      this.dic.push(dicObj)
    } else {
      Object.assign(this.dic[index], dicObj)
    }
  }

  forEach(func) {
    this.dic.forEach(item => func(item))
  }
}
