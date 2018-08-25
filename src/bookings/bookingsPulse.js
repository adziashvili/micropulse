import {
    ExcelReader,
    Modeler,
    Table,
    Reporter,
    Dictionary,
    DateHelper,
    StringHelper,
    Analyzer
} from '../common'

export default class BookingsPulse {

    constructor( pathtoFile ) {
        this.file = pathtoFile

        this.dictionary = new Dictionary( [
            { key: 'Project: Practice', shortName: 'Practice' },
            { key: 'Effective Date', shortName: 'Date' },
            { key: 'Amount (converted)', shortName: 'Bookings' },
            { key: 'Project: Discount Percentage', shortName: 'Discount' },
            { key: 'Project: Discount Reason', shortName: 'Discount Reason' },
            { key: 'Project: Partner Account', shortName: 'Partner' } ] )
    }

    report() {}

    run( isVerbose = false ) {

        new ExcelReader
            .load( this.file )
            .then( ( data ) => {
                let table = new Table().process( data.getWorksheet( data.worksheets[ 0 ].id ) )
                // First we process the data we got

                let modeler = new Modeler( table )
                modeler.cols = [ {
                    key: 'Effective Date',
                    transform: ( d ) => {
                        return DateHelper.getMonthYear( d )
                    }
                } ]
                let bookKey = 'Amount (converted)'
                modeler.rows = [ { key: "Project: Practice" } ]
                modeler.stats = [ { key: bookKey } ]

                modeler.custom = [ {
                    key: 'vs. Practice Total',
                    isRowTransformer: true,
                    transform: ( recs, modeler, series ) => {

                        let totals = series.map( ( item ) => {
                            return item.length === 0 ? 0 : item.reduce(
                                ( sum, s ) => { return sum + s[ bookKey ] }, 0 )
                        } )
                        // This gives us the total of bookings across the cols we have

                        let allTotal = totals.length > 0 ? totals[ totals.length - 1 ] : 0
                        // the last record includes all records, so its sum is the TOTAL for all

                        return totals.map( ( total ) => {
                            return StringHelper.toPercent( Analyzer.devide( total, allTotal ) )
                        } )
                    }
                    }, {
                    key: 'vs. Area Total',
                    isRowTransformer: true,
                    transform: ( recs, modeler, series ) => {
                        let totals = series.map( ( item ) => {
                            return item.length === 0 ? 0 : item.reduce(
                                ( sum, s ) => { return sum + s[ bookKey ] }, 0 )
                        } )
                        // This gives us the total of bookings across the cols we have

                        let allTotal = Analyzer.sumProperty( modeler.model.records, bookKey )
                        // This is precalculated and should give us the sum of all records

                        return totals.map( ( total ) => {
                            return StringHelper.toPercent( Analyzer.devide( total, allTotal ) )
                        } )
                    }
                        }, {
                    key: 'Engagements Count',
                    transform: ( recs ) => { return recs.length }
                } ]
                modeler.build()
                // We build the models

                let reporter = new Reporter( modeler )

                reporter.dictionary = this.dictionary
                // Passing our dictionary to the reporter

                reporter.report( isVerbose )
                // Reporting
            } )
            .catch( ( e ) => {
                console.log( "Ooops! We have an error".red );
                console.log( e )
                throw e
            } )

        return Promise.resolve( true )
    }
}
