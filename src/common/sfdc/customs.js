import {
  StringHelper,
  MathHelper
} from 'ika-helpers'

export default class Customs {
  static countPerColunm() {
    return array => array.length
  }

  static ratioSumVsSelfTotal(property) {
    return (recs, modeler, series) => {
      const totals = series.map((item) => {
        if (item.length === 0) return 0
        return item.reduce((sum, s) => sum + s[property], 0)
      })
      // This gives us the total of bookings across the cols we have

      const allTotal = totals.length > 0 ? totals[totals.length - 1] : 0
      // the last record includes all records, so its sum is the TOTAL for all

      return totals.map(total => StringHelper.toPercent(MathHelper.devide(total, allTotal)))
    }
  }

  static ratioSumVsTotal(property) {
    return (recs, modeler, series) => {
      const totals = series.map((item) => {
        if (item.length === 0) return 0
        return item.reduce((sum, s) => sum + s[property], 0)
      })
      // This gives us the total of pipeline across the cols we have

      const allTotal = MathHelper.sumProperty(modeler.model.records, property)
      // This is precalculated and should give us the sum of all records

      return totals.map(total => StringHelper.toPercent(MathHelper.devide(total, allTotal)))
    }
  }

  static sumYTD(property, isCurrency = false, isToThousands = false) {
    return (recs, modeler, series) => {
      if (series.length === 0) return []
      const totals = series.map((item) => {
        if (item.length === 0) {
          return 0
        }
        return item.reduce((sum, s) => sum + s[property], 0)
      })
      const actuals = MathHelper.mapToRollingSum(totals, true)
      return actuals.map((v) => {
        const value = isToThousands ? StringHelper.toThousands(v) : v
        return isCurrency ? `$${value}` : value
      })
    }
  }
}
