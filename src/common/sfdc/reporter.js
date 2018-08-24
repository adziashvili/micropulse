import {
    JSONHelper,
    ReportHelper,
    StringHelper as SH,
    StringBuffer,
    Layout
}
from '../../common'

export default class Reporter {

    constructor( modeler, isAddTotal = true ) {
        this.modeler = modeler
        this.isAddTotal = isAddTotal

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
        this.rh.setDivider( {
            len: layout.totalSeperator.length +
                layout.lengths[ layout.lengths.length - 1 ]
                .reduce( ( sum, len ) => { return sum + len } )
        } )
        // Optimizing the layout to the actual data

        rh.addReportTitle()
        rh.newLine()
        // Adding report title

        this.addHeaders()
        rh.newLine()
        // Adding headers

        this.addRowsCascade( model )
        // adding the data

        let total = this.getValues( "TOTAL" )
        this.addRow( total, ( s ) => { return s.bold } )
        rh.newLine()
        this.addCustoms([], -1)
        rh.newLine()
        // Printing totals first. This is a matter of style.

        this.addStats( stats )
        // Printins the requested stats
    }

    addStats( stats ) {
        let rowStats = this.getRowStats()
        stats.forEach( ( stat ) => {
            let values = rowStats.map( ( obj ) => {
                return obj[ stat.key ]
            } )
            this.addStat( stat.key, values )
            this.rh.newLine()
        } )
    }

    addStat( key, values ) {
        let sample = values[ 0 ]
        this.addRow( [ key ], ( s ) => { return s.grey.bold } )
        for ( let skey in sample ) {
            let statsValues = [ this.layout.indent + skey ]
            values.forEach( ( v ) => {
                statsValues.push( v[ skey ] )
            } )
            this.addRow( statsValues, ( s ) => { return s.grey } )
        }
    }

    getRowStats( rowFilter = [] ) {

        let arr = []

        this.colsKVPs.forEach( ( cKvp ) => {
            let s = this.modeler.find( 'stats', rowFilter, cKvp )
            if ( s !== undefined ) arr.push( s )
        } )

        if ( this.isAddTotal ) {
            let s = this.modeler.find( 'stats', rowFilter, [] )
            if ( s !== undefined ) arr.push( s )
        }

        return arr
    }

    /**
     * Returns the records for a given row.
     *
     * @param {[type]} rowFilter [description]
     *
     * @return {[type]} [description]
     */
    getRecords( rowFilter ) {
        let values = []

        // Adds value per colunm
        this.colsKVPs.forEach( ( cKvp ) => {
            values.push( this.modeler.find( 'records', rowFilter, cKvp ) )
        } )

        // if requested, adds total
        if ( this.isAddTotal ) {
            values.push( this.modeler.find( 'records', rowFilter, [] ) )
        }

        return values
    }

    getValues( firstValue, rowFilter ) {

        let values = [ firstValue ]

        // Adds value per colunm
        this.colsKVPs.forEach( ( cKvp ) => {
            this.push( values, this.modeler.find( 'stats', rowFilter, cKvp ) )
        } )

        // if requested, adds total
        if ( this.isAddTotal ) {
            this.push( values, this.modeler.find( 'stats', rowFilter, [] ) )
        }

        return values
    }

    defaultStat( key ) {
        switch ( this.modeler.table.getType( key ) ) {
            case 'number':
            case 'currency':
            case 'percent':
                return 'sum'
            case 'string':
            case 'boolean':
            case 'date':
            default:
                return 'countTotal'
        }
    }

    format( key, value ) {
        let transformer = this.modeler.transformer( key )

        if ( transformer !== null ) {
            return transformer( value )
        }

        switch ( this.modeler.table.getType( key ) ) {
            case 'currency':
                return "$" + SH.toThousands( value ) + "k"
            case 'percent':
                return SH.toPercent( value )
            case 'number':
            case 'string':
            case 'boolean':
            case 'date':
            default:
                return SH.toNumber( value )
        }
    }

    push( values, objStats ) {

        let { stats } = this.modeler
        let NA = "N/A"

        if ( !objStats ||
            !Array.isArray( stats ) ||
            stats.length === 0 ) {
            values.push( NA )
            return
        }

        let { key, stat } = stats[ 0 ]

        if ( !stat ) {
            stat = this.defaultStat( key )
        }

        if ( !Object.keys( objStats ).includes( key ) ||
            !Object.keys( objStats[ key ] ).includes( stat ) ) {

            values.push( NA )
            return
        }

        values.push( this.format( key, objStats[ key ][ stat ] ) )
    }

    addRowsCascade( model, filter = [], level = 0 ) {
        if ( !!model.rows ) {
            model.rows.forEach( ( row, index, rows ) => {

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

                // if ( level !== 0 && index === rows.length - 1 ) {
                //     console.log( this.layout.nestedIndent( level ) + "Total" );
                // }

                if ( level === 0 ) {
                    console.log()
                    this.addCustoms( filter.concat( newFilter ), level + 1 )
                    this.rh.addDevider()
                    console.log()
                }
                // Seperating the groups of rows
            } )
        }
    }

    addCustoms( filter, level ) {
        let { custom } = this.modeler
        custom.forEach( ( c ) => {
            let transformer = this.modeler.transformer( c.key )
            if ( transformer !== null ) {
                let recs = this.getRecords( filter )
                let values = [ this.layout.nestedIndent( level ) + c.key ]
                recs.forEach( ( colRecords, index, allRecordsArray ) => {
                    values.push( transformer(
                        colRecords,
                        this.modeler,
                        allRecordsArray ) )
                } )
                this.addRow( values )
            }
        } )
    }

    addHeaders() {
        let { layout } = this
        let { cols, totalSeperator } = layout
        cols.forEach( ( col, i ) => {
            let headers = layout.getHeaders( i, this.isAddTotal )
            let sb = new StringBuffer()
            headers.forEach( ( h, i, headers ) => {
                if ( i === headers.length - 1 && headers.length > 1 ) {
                    sb.append( totalSeperator )
                }

                if ( i => 0 ) {
                    sb.appendPad( h.value, h.length )
                } else {
                    sb.appendExact( h.value, h.length )
                }
            } )
            console.log( sb.toString().toUpperCase().bold );
        } )
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
        let { cols, lengths, totalSeperator } = this.layout
        let vLengths = lengths.length > 0 ? lengths[ lengths.length - 1 ] : []

        if ( vLengths.length < values.length ) {
            throw "Ooops! we have a bug... expecting at least " + values.length + " entries in vLengths"
        }

        let sb = new StringBuffer()
        for ( let i = 0; i < values.length; i++ ) {

            if ( i === values.length - 1 && values.length > 1 ) {
                sb.append( totalSeperator )
            }

            if ( i > 0 ) {
                sb.appendPad( values[ i ], vLengths[ i ] )
            } else {
                sb.appendExact( values[ i ], vLengths[ i ] )
            }

        }
        console.log( decorator === null ? sb.toString() : decorator( sb.toString() ) )
    }

}
