import {
    JSONHelper,
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

        let { model, stats } = this.modeler
        let { layout, rh } = this
        // localizing some variables

        this.rowsKVPs = this.modeler.expand( model, 'rows' )
        this.colsKVPs = this.modeler.expand( model, 'cols' )
        // We rather keep these calls here in case the underlying data changes

        layout.rebuild( this.modeler )
        // Optimizing the layout to the actual data

        rh.addReportTitle()
        rh.newLine()
        // Adding report title

        this.addHeaders()
        rh.newLine()
        // Adding headers

        this.addRow( this.getValues( "TOTAL" ), ( s ) => { return s.bold } )
        rh.newLine()
        // Printing totals first. This is a matter of style.

        this.addRowsCascade( model )
        // adding the gist of the report

        // TODO: We need to print a report on the stats requested by the user.

        // Done
    }

    addRowsCascade( model, filter = [], level = 0 ) {

        if ( !!model.rows ) {

            model.rows.forEach( ( row ) => {

                let newFilter = { key: row.key, value: row.value }

                this.addRow(
                    this.getValues(
                        this.layout.nestedIndent( level ) + row.value,
                        filter.concat( newFilter ) ),
                    level !== 0 ? null : ( s ) => { return s.bold } )
                // Printing data

                if ( !!row.rows ) {
                    this.addRowsCascade( row, filter.concat( newFilter ), level + 1 )
                }
                // Forking for other children

                if ( level === 0 ) {
                    console.log()
                }
                // Seperating the groups of rows

            } )
        }
    }

    getValues( firstValue, rowFilter, isAddTotal = true ) {

        let values = [ firstValue ]

        // Adds value per colunm
        this.colsKVPs.forEach( ( cKvp ) => {
            this.push( values, this.modeler.find( 'stats', rowFilter, cKvp ) )

            //TDOO: Support subtotal per col change
        } )

        // if requested, adds total
        if ( isAddTotal ) {
            this.push( values, this.modeler.find( 'stats', rowFilter, [] ) )
        }

        return values
    }

    push( values, stats ) {

        if ( undefined === stats ) {
            values.push( '-' )
        } else {
            values.push( stats.count )
        }

    }

    addHeaders( isAddTotal = true ) {
        let { layout } = this
        let { cols } = layout
        let otherColWidth = cols[ cols.length - 1 ].layoutLength

        for ( let i = 0; i < cols.length; i++ ) {
            let sb = new StringBuffer()
            sb.append( SH.exact( "", layout.firstColWidth ) )
            for ( let j = 0; j <= i; j++ ) {
                cols[ i ].distinctValues.forEach( ( dv ) => {
                    sb.append( SH.exact( dv, cols[ i ].layoutLength ) )
                } )
            }
            //TODO 1: This does not support subtotal per colum yet.

            //TODO 2: This should be using addRow in some way,
            //        however this model of using col[i].layoutLength should be used

            // Adds total if requested
            if ( i === 0 && isAddTotal ) {
                sb.append( SH.exact( "TOTAL", otherColWidth ) )
            }

            console.log( sb.toString().toUpperCase().bold )
        }
    }

    /**
     * Prints a row of values to STD out.
     *
     * If decorator is provided, passed the final string for decoration
     * prior to printing.
     *
     * @param {Array} values                Values to print
     * @param {Function} [decorator=null]   A function that recieves one string
     *                                      and is expected to return a string.
     */
    addRow( values, decorator = null ) {

        let { indent, firstColWidth, cols, totalSeperator } = this.layout
        let otherColWidth = cols[ cols.length - 1 ].layoutLength

        let sb = new StringBuffer()

        for ( let i = 0; i < values.length; i++ ) {
            if ( i === 0 ) {
                sb.appendExact( values[ i ], firstColWidth )
            } else {
                sb.appendExact( values[ i ], otherColWidth )
            }
        }
        console.log( decorator === null ? sb.toString() : decorator( sb.toString() ) )
    }

}
