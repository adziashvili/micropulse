export default class Utilizations {

    constructor( billableUtilization = 0, investmentUtilization = 0 ) {
        this.billable = billableUtilization
        this.investment = investmentUtilization
    }

    set billable( billableUtilization ) {
        this._b = billableUtilization
    }
    get billable() {
        return this._b
    }

    set investment( investmentUtilization ) {
        this._i = investmentUtilization
    }
    get investment() {
        return this._i
    }

    get total() {
        return this.billable + this.investment
    }
}
