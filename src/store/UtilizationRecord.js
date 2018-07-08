
/**
 * Types of utilization records
 * @type {Array}
 */
const _UT_TYPES = [ "MONTHLY", "YTD" ]

export default class UtilizationRecord {

    constructor( type, name, date, billableUtilization, investmentUtilization ) {
        this.type = type
        this.name = name
        this.date = date
        this.billable = billableUtilization
        this.investment = investmentUtilization
    }

    static get TYPES() {
        return _UT_TYPES
    }

    static get TYPE_MONTHLY() {
        return _UT_TYPES[ 0 ]
    }

    static get TYPE_YTD() {
        return _UT_TYPES[ 1 ]
    }

    set type( type ) {
        if ( !UtilizationRecord.TYPES.includes( type ) ) {
            console.log( "Utilization Record must be either '%s' or '%s'", UtilizationRecord.TYPE_MONTHLY, UtilizationRecord.TYPE_YTD )
            throw "DataValidationError: '" + type +
                    "' is an invalid utilization record type"

        }

        this._type = type
    }

    get type() {
        return this._type
    }

    set name( name ) {

        if ( !name ) {
            throw "DataValidationError: Utilization record must be associated with a name. '" +
                    name + "' is invalid"
        }
        this._name = name
    }

    get name() {
        return this._name
    }

    set date( date ) {
        if ( !date ) {
            date = new Date( Date.now() )
        } else {
            let timeInMili = "string" === typeof( date )
                ? Date.parse( date )
                : date
            date = new Date( timeInMili )
        }
        this._date = date
    }

    get date() {
        return this._date
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
