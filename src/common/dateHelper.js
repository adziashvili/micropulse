const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
}

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

export default class DateHelper {

    constructor( date ) {
        this.date = date
    }

    get localeDateString() {
        return this.date.toLocaleDateString( 'de-DE', options )
    }

    get monthName() {
        return monthNames[ this.date.getMonth() ]
    }

    static getMonthName( month ) {
        return monthNames[ month ]
    }

}
