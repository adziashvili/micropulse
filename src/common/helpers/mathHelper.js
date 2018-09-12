import { Analyzer } from '..'

export default class MathHelper {
  static devide(a, b, fixed = 2) {
    if (!b || b === 0) return b
    return (a / b).toFixed(fixed) * 1
  }

  static devideArrays(a = [], b = []) {
    if (!Array.isArray(a) || !Array.isArray(b)) {
      return undefined
    }

    if (a.length !== b.length) {
      return undefined
    }

    const devideResultArr = []
    a.forEach((v, i) => {
      const x = !v || Number.isNaN(v) ? 0 : v
      const y = Number.isNaN(b[i]) ? 0 : b[i]
      devideResultArr.push(MathHelper.devide(x, y, 3))
    })
    return devideResultArr
  }

  static subtract(a, b, fixed = 2) {
    const x = !a || Number.isNaN(a) ? 0 : a
    const y = !b || Number.isNaN(b) ? 0 : b
    return (x - y).toFixed(fixed)
  }

  static subtractArrays(a = [], b = []) {
    if (!Array.isArray(a) || !Array.isArray(b)) {
      return undefined
    }

    if (a.length !== b.length) {
      return undefined
    }

    return a.map((v, i) => MathHelper.subtract(v, b[i], 1))
  }

  static sumArrays(arrayOArrays = [], property = '') {
    return arrayOArrays.map((array) => {
      if (array.length === 0) {
        return 0
      }
      return array.reduce((sum, s) => sum + s[property], 0)
    })
  }

  static sumProperty(arrayOfObjects = [], property = '') {
    if (!Array.isArray(arrayOfObjects) || arrayOfObjects.length === 0) {
      return 0
    }

    return arrayOfObjects.reduce((sum, obj) => sum + (Object.keys(obj).includes(property) ?
      obj[property] : 0
    ), 0)
  }

  static avgProperty(arrayOfObjects = [], property = '') {
    return MathHelper.devide(MathHelper.sumProperty(arrayOfObjects, property), arrayOfObjects.length) *
      1
  }

  static avg(values = []) {
    return MathHelper.devide(values.reduce((sum, v) => sum + v), values.length) * 1
  }

  static PoP(data = [], transform = null) {
    if (!data || !Array.isArray(data)) {
      console.log('WARNING: data passed to MathHelper.PoP must be an array. Received:', typeof data);
      return []
    }

    if ((!transform || transform === null) && !Analyzer.isNumber(data)) {
      console.log('WARNING: When trasnform is null or undefined data must numeric array.');
      return []
    }

    const values = transform ? data.map(item => transform(item)) : data
    const change = [0]

    values.forEach((v, i, valuesArray) => {
      if (i === 0) return
      change.push(((MathHelper.devide(v, valuesArray[i - 1], 4) * 1) - 1).toFixed(4) * 1)
    })

    return change
  }

  static mapToRollingSum(arrayOfNumbers, isLastValueTotal = false) {
    const values = []
    let sum = 0

    for (let i = 0; i < arrayOfNumbers.length; i += 1) {
      if (isLastValueTotal && i === arrayOfNumbers.length - 1) {
        values.push(sum)
      } else {
        sum += arrayOfNumbers[i]
        values.push(sum)
      }
    }

    return values
  }
}
