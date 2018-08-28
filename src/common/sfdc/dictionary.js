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

  exist(key) {
    return !!this.find(key)
  }

  get(key, prop = 'shortName') {
    const item = this.find(key)
    if (!item || !Object.keys(item).includes(prop)) {
      return key
    }
    return item[prop]
  }

  set(dicObj) {
    if (!dicObj || !dicObj.key || !dicObj.shortName) {
      console.log('Invalid dictionary item. Ignored'.yellow, dicObj);
    }

    const index = this.dic.findIndex(item => item.key === dicObj.key)

    if (index === -1) {
      this.dic.push(dicObj)
    } else {
      this.dic[index] = dicObj
    }
  }
}
