import {
    JSONHelper,
    ReportHelper,
    DateHelper,
    StringHelper as SH,
    StringBuffer,
    Layout,
    Dictionary,
    Analyzer
}
from '../../common'

export default class Reporter {

    constructor( modeler, isAddTotal = true ) {
        this.modeler = modeler
        this.isAddTotal = isAddTotal
        this.rh = new ReportHelper( modeler.table.meta.name, modeler.table.meta.date )
        this.layout = new Layout()
        this._dictionary = new Dictionary( Analyzer.dictionary() )
    }

    set dictionary( dictionary ) {
        this._dictionary = this.dictionary.add( dictionary )
    }

    get dictionary() {
        return this._dictionary
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

        let total = this.getStats( "TOTAL" )
        this.addRow( total, ( s ) => { return s.bold } )
        this.addCustoms( [], 1 )
        rh.newLine()
        // Printing totals first. This is a matter of style.

        if ( isVerbose ) {
            this.addStats( stats )
            // Printins the requested stats
        }
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
        this.addRow( [ this.dictionary.get( key ) ], ( s ) => { return s.grey.bold } )
        for ( let skey in sample ) {
            let statsValues = [ this.layout.indent + this.dictionary.get( skey ) ]
            let type = this.getStatFormatType( key, skey )
            values.forEach( ( v ) => {
                statsValues.push( this.defaultFormat( type, v[ skey ] ) )
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

    getStats( firstValue, rowFilter ) {

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

        if ( !Object.keys( objStats ).includes( key ) || !Object.keys( objStats[ key ] ).includes( stat ) ) {
            values.push( NA )
            return
        }

        values.push( this.format( key, objStats[ key ][ stat ] ) )
    }

    format( key, value ) {
        let transformer = this.modeler.transformer( key )
        if ( !!transformer ) {
            return transformer( value )
        }
        return this.defaultFormat( this.modeler.table.getType( key ), value )
    }

    getStatFormatType( key, property ) {

        if ( !Analyzer.typeSensitiveStats().includes( property ) ) {
            return 'number'
        }

        let type = this.modeler.table.getType( key )

        if ( type === 'boolean' && [ 'avg', 'avgNonEmpty' ].includes( property ) ) {
            return 'percent'
        }

        return type
    }

    defaultFormat( type = 'number', value ) {
        switch ( type ) {
            case 'currency':
                return "$" + SH.toThousands( value )
            case 'percent':
                return SH.toPercent( value )
            case 'date':
                return new DateHelper( value ).shortDate
            case 'number':
            case 'string':
            case 'boolean':
            default:
                return SH.toNumber( value )
        }
    }

    addRowsCascade( model, filter = [], level = 0 ) {
        if ( !!model.rows ) {
            model.rows.forEach( ( row, index, rows ) => {

                let newFilter = { key: row.key, value: row.value }
                this.addRow(
                    this.getStats(
                        this.layout.nestedIndent( level ) + row.value,
                        filter.concat( newFilter ) ),
                    level !== 0 ? undefined : ( s ) => { return s.bold } )
                // Printing data

                if ( !!row.rows ) {
                    this.addRowsCascade( row, filter.concat( newFilter ), level + 1 )
                }
                // Forking for other children

                // if ( level !== 0 && index === rows.length - 1 ) {
                //     console.log( this.layout.nestedIndent( level ) + "Total" );
                // }

                if ( level === 0 ) {
                    // this.rh.newLine( 1, this.modeler.rows.length > 1 )
                    this.addCustoms( filter.concat( newFilter ), level + 1 )
                    // if ( this.modeler.rows.length > 1 ) {
                    this.rh.addDevider()
                    console.log()
                    // }
                }
                // Seperating the groups of rows
            } )
        }
    }

    addCustoms( filter, level ) {
        let { custom } = this.modeler
        custom.forEach( ( c ) => {
            let transformer = this.modeler.transformer( c.key, true )
            if ( !!transformer && !!transformer.transform ) {
                let recs = this.getRecords( filter )
                let values = [ this.layout.nestedIndent( level ) + c.key ]

                if ( transformer.isRowTransformer ) {
                    values = [ ...values, ...transformer.transform( [], this.modeler, recs ) ]
                } else {
                    recs.forEach( ( colRecords, index, allRecordsArray ) => {
                        values.push( transformer.transform( colRecords, this.modeler,
                            allRecordsArray ) )
                    } )
                }
                this.addRow( values )
            }
        } )
    }

    addHeaders() {
        let { layout } = this
        let { cols, totalSeperator, firstColWidth } = layout
        cols.forEach( ( col, i ) => {
            let headers = layout.getHeaders( i, this.isAddTotal )
            let sb = new StringBuffer()
            headers.forEach( ( h, i, headers ) => {
                if ( i === headers.length - 1 && headers.length > 1 ) {
                    sb.append( totalSeperator )
                }

                if ( i => 0 ) {
                    sb.appendPad( h.value, h.length )
                } else { // first
                    sb.appendExact( h.value, firstColWidth )
                }
            } )
            console.log( sb.toString().toUpperCase().bold );
        } )
    }

    /**
     * Prints a row of values to STD out according to the layout.
     *
     * If decorator is provided, the decorator is passed the final string
     * for decoration prior to printing.
     *
     * @param {Array} values                    Values to print
     * @param {Function} [decorator=undefined]  A function that recieves one string
     *                                          and is expected to return a string.
     */
    addRow( values, decorator = undefined ) {

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
        console.log( !decorator ? sb.toString() : decorator( sb.toString() ) )
    }

}
