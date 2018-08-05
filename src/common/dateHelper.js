const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
]

/**
 * Helper function for quick date functions
 */
export default class DateHelper {

    constructor( date ) {
        this.date = date
    }

    static parse( date ) {
        if ( date instanceof Date ) {
            if ( Number.isNaN( date.valueOf() ) ) {
                // invalid date object
                return null
            } else {
                return date
            }
        }
        if ( 'string' === typeof date ) {
            let ms = Date.parse( date )
            if ( !Number.isNaN( ms ) ) {
                return new Date( ms )
            }
        }
    }

    static getMonthName( month ) {
        return monthNames[ month ]
    }

    get localeDateString() {

        let options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }

        return this.date.toLocaleDateString( 'en-US', options )
    }

    get monthYear() {
        return this.monthName + " " + this.year
    }

    get year() {
        return this.date.getFullYear()
    }

    get isNew() {
        let today = new Date( Date.now() )
        return this.date.getMonth() === today.getMonth() - 1
    }

    get monthName() {
        return monthNames[ this.date.getMonth() ]
    }

    get date() {
        return this._date
    }

    set date( d ) {

        let tmpDate = DateHelper.parse( d )
        if ( null === tmpDate ) {
            console.log( "%s is an invalid date".red, d );
            throw "Error: Invalid date or date string"
        }

        this._date = tmpDate
    }

}
