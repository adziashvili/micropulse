import {
    Report,
    Dictionary,
    DateHelper,
    StringHelper,
    Analyzer
} from '../common'

export default class BookingsPulse extends Report {

    constructor( pathtoFile ) {
        super()
        this.file = pathtoFile
        this.setup()
    }

    setup() {
        let bookingsKey = 'Amount (converted)'

        this.dictionary = new Dictionary( [
            { key: 'TOTAL', shortName: 'APJ' },
            { key: 'Project: Practice', shortName: 'Practice' },
            { key: 'Effective Date', shortName: 'Date' },
            { key: 'Amount (converted)', shortName: 'Bookings' },
            { key: 'Project: Discount Percentage', shortName: 'Discount' },
            { key: 'Project: Discount Reason', shortName: 'Discount Reason' },
            { key: 'Project: Partner Account', shortName: 'Partner' } ] )

        this.cols = [ {
            key: 'Effective Date',
            transform: ( d ) => {
                return DateHelper.getMonthYear( d )
            }
      } ]
        // Defines the report to be based on effective date's month

        this.rows = [ {
            key: "Project: Practice",
            rollup: { values: [ "ANZ", "ASEAN", "S.KOREA" ], key: "APAC" }
      } ]
        // Defines one grouping by practice with rollup for APAC

        this.stats = [ { key: bookingsKey } ]
        // Defines the main value we would like to showcase

        this.custom = [
            {
                key: 'Avergae Bookings Size',
                isRowTransformer: true,
                transform: ( recs, modeler, series ) => {
                    return series.map( ( item ) => {
                        return "$" + StringHelper.toThousands(
                            Analyzer.avgProperty( item, bookingsKey ) )
                    } )
                }
          },
            {
                key: 'Engagements Count',
                transform: ( recs ) => { return recs.length }
          },
            {
                key: 'vs. Practice Total',
                isRowTransformer: true,
                transform: ( recs, modeler, series ) => {

                    let totals = series.map( ( item ) => {
                        return item.length === 0 ? 0 : item.reduce(
                            ( sum, s ) => { return sum + s[ bookingsKey ] }, 0 )
                    } )
                    // This gives us the total of bookings across the cols we have

                    let allTotal = totals.length > 0 ? totals[ totals.length - 1 ] : 0
                    // the last record includes all records, so its sum is the TOTAL for all

                    return totals.map( ( total ) => {
                        return StringHelper.toPercent( Analyzer.devide( total, allTotal ) )
                    } )
                }
          },
            {
                key: 'vs. Area Total',
                isRowTransformer: true,
                transform: ( recs, modeler, series ) => {
                    let totals = series.map( ( item ) => {
                        return item.length === 0 ? 0 : item.reduce(
                            ( sum, s ) => { return sum + s[ bookingsKey ] }, 0 )
                    } )
                    // This gives us the total of bookings across the cols we have

                    let allTotal = Analyzer.sumProperty( modeler.model.records, bookingsKey )
                    // This is precalculated and should give us the sum of all records

                    return totals.map( ( total ) => {
                        return StringHelper.toPercent( Analyzer.devide( total, allTotal ) )
                    } )
                }
            } ]
        // Setting up custom analysis
    }
}
