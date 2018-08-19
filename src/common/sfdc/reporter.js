import {
    ReportHelper,
    StringHelper as SH,
    StringBuffer,
    Layout
}
from '../../common'

export default class Reporter {

    constructor( modeler ) {
        this.modeler = modeler
        this.rh = new ReportHelper( modeler.table.meta.name, modeler.table.meta.date )
        this.layout = new Layout()
    }

    report( isVerbose = false ) {

        let { model } = this.modeler
        this.layout.rebuild( this.modeler )

        // Starting the report
        this.rh.addReportTitle()
        this.addHeaders()

        console.log( this.layout.rows )
        console.log();

        let rows = [
            { key: "Practice", value: 'ASEAN' },
            { key: "Stage", value: 'Business Validation' } ]

        let cols = [
            { key: 'Is Partner Account Involved?', value: false },
            { key: 'Forecast Status', value: 'In Forecast' } ]

        console.log( this.modeler.find( 'stats', rows, cols ) )

    }

    addHeaders() {
        let { layout } = this
        let { cols } = layout

        for ( let i = 0; i < cols.length; i++ ) {
            let sb = new StringBuffer()
            sb.append( SH.exact( "", layout.firstColWidth ) )
            for ( let j = 0; j <= i; j++ ) {
                cols[ i ].distinctValues.forEach( ( dv ) => {
                    sb.append( SH.exact( dv, cols[ i ].layoutLength ) )
                } )
            }
            console.log( sb.toString().toUpperCase().bold )
        }
    }

}
