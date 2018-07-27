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

    static getMonthName( month ) {
        return monthNames[ month ]
    }

}
