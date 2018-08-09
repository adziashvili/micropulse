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

    /**
     * Calculates the min date and max date in an array of objects.
     *
     * @param {Array}  [objArray=[]] Array of objects to scan
     * @param {String} [dateProp=""] The propery in the objects that holds the date prop
     *
     * @return {[type]} Object with two properties minDate and maxDate.
     *                  If objArray is not an array with size > 0 or if
     *                  objProp is not a string {null, null} is returned.
     */
    static getMinMaxDates( objArray = [], dateProp = "" ) {

        let dates = { minDate: null, maxDate: null }

        if ( typeof dateProp !== 'string' || !Array.isArray( objArray ) || objArray.length === 0 ) {
            return null
        } else {
            dates.minDate = objArray[ 0 ][ dateProp ]
            dates.maxDate = objArray[ 0 ][ dateProp ]
        }

        objArray.forEach( ( obj ) => {
            if ( obj[ dateProp ].valueOf() < dates.minDate.valueOf() ) {
                dates.minDate = obj[ dateProp ]
            }
            if ( obj[ dateProp ].valueOf() > dates.maxDate.valueOf() ) {
                dates.maxDate = obj[ dateProp ]
            }
        } )

        return dates

    }

    constructor( date ) {
        this.date = date
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

    isPast( addMoreMonths = 0 ) {
        let today = new Date( Date.now() )
        let dateInMonths = ( this.date.getFullYear() - 1 ) * 12 + addMoreMonths
        let todayInMonths = ( today.getFullYear() - 1 ) * 12 + today.getMonth()

        return dateInMonths < todayInMonths
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
