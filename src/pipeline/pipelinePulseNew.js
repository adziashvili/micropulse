import {
    Report,
    Dictionary,
    DateHelper,
    StringHelper,
    Analyzer
} from '../common'

export default class PipelinePulseNew extends Report {
    constructor( file ) {
        super()
        this.file = file
        this.setup()
    }

    setup() {

        let amountKey = 'Total Contract Amount (converted)'

        this.dictionary = new Dictionary( [
            { key: 'TOTAL', shortName: 'APJ' },
            { key: 'Practice', shortName: 'Practice' },
            { key: 'Close Date', shortName: 'Close Data' },
            { key: 'Account Name', shortName: 'Account' },
            { key: 'Opportunity Name', shortName: 'Opportunity' },
            { key: 'Forecast Status', shortName: 'Forecast' },
            { key: 'Total Contract Amount (converted)', shortName: 'Amount' },
            { key: 'Influenced Revenue (converted)', shortName: 'Influenced Revenue' },
            { key: 'Adoption Incentive Amount (converted)', shortName: 'Adoption Incentive' },
            { key: 'Project Duration (mos)', shortName: 'Duration( m )' },
            { key: 'Probability (%)', shortName: 'Probability' },
            { key: 'Opportunity Owner', shortName: 'Owner' },
            { key: 'Stage', shortName: 'Stage' },
            { key: 'Is Partner Account Involved?', shortName: 'Partner Attached' } ] )

        this.cols = [ { key: 'Close Date', transform: ( d ) => { return DateHelper.getMonthYear( d, true ) } } ]
        this.rows = [ { key: "Practice", rollup: { values: [ "ANZ", "ASEAN", "S.KOREA" ], key: "APAC" } }, { key: "Stage" } ]

        // Stats settings can inlcude the key to indicate which stat we would like to show case
        this.stats = [
            { key: 'Total Contract Amount (converted)' },
            { key: 'Project Duration (mos)' },
            { key: 'Is Partner Account Involved?' },
            { key: 'Close Date' } ]

        // We can pass a transformer to caluclate values or to caluclate the entire row.
        // Add isRowTransformer: true for row
        this.custom = [
            {
                key: 'Avergae Deal Size',
                isRowTransformer: true,
                transform: ( recs, modeler, series ) => {
                    return series.map( ( item ) => {
                        return "$" + StringHelper.toThousands(
                            Analyzer.avgProperty( item, amountKey ) )
                    } )
                }
            },
            {
                key: "Opportunities Count",
                transform: ( records, modeler, allColsRecords ) => { return records.length }
            },
            {
                key: 'Pipe Distribution',
                isRowTransformer: true,
                transform: ( recs, modeler, series ) => {

                    let totals = series.map( ( item ) => {
                        return item.length === 0 ? 0 : item.reduce(
                            ( sum, s ) => { return sum + s[ amountKey ] }, 0 )
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
                key: 'vs. APJ',
                isRowTransformer: true,
                transform: ( recs, modeler, series ) => {
                    let totals = series.map( ( item ) => {
                        return item.length === 0 ? 0 : item.reduce(
                            ( sum, s ) => { return sum + s[ amountKey ] }, 0 )
                    } )
                    // This gives us the total of pipeline across the cols we have

                    let allTotal = Analyzer.sumProperty( modeler.model.records, amountKey )
                    // This is precalculated and should give us the sum of all records

                    return totals.map( ( total ) => {
                        return StringHelper.toPercent( Analyzer.devide( total, allTotal ) )
                    } )
                }
          }
         ]
    }
}
