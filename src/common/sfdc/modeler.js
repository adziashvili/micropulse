import {
    JSONHelper,
    Analyzer
} from '../../common'

export default class Modeler {

    constructor( table, dictionary = [] ) {
        this.table = table
        this._rows = []
        this._cols = []
    }

    model() {
        let model = {}
        this.construct( model )
        this.allocate( model )
        this.calculate( model )
        this.describe( model )
        return model
    }

    construct( model ) {
        Object.assign( model, { key: 'root', value: 'root', rows: [] } )

        this.addCols( model, this.cols )
        this.addRows( model, this.rows )
    }

    addCols( data, cols ) {
        if ( cols.length === 0 ) return
        // nothing to add

        let { key } = cols[ 0 ]
        let values = this.table.distinct( key )
        data.cols = []
        values.forEach( ( value ) => {
            data.cols.push( { key, value, rows: [] } )
        } )
        // Adding a stackby model to the data model we got

        if ( cols.length > 1 ) {
            let [ , ...next ] = cols
            data.cols.forEach( ( g ) => {
                this.addCols( g, next )
            } )
        }
        // For each of the values we have under the added stacks, if there
        // is more cols, they are added.
    }

    addRows( data, rows ) {
        if ( rows.length === 0 ) return

        let { key } = rows[ 0 ]

        if ( !!data.rows ) {
            let values = this.table.distinct( key )
            values.forEach( ( value ) => {
                let [ , ...next ] = rows
                let newRow = { key, value, rows: [] }
                data.rows.push( newRow )
                this.addRows( newRow, next )
            } )
        }

        if ( Array.isArray( data.cols ) ) {
            data.cols.forEach( ( c ) => {
                this.addRows( c, rows )
            } )
        }
    }

    allocate( model, fRows = [], fCols = [] ) {

        // Get every relevant object called for record allocation
        for ( let key in model ) {
            switch ( key ) {
                case 'rows':
                    model.rows.forEach( ( r ) => {
                        this.allocate( r, fRows.concat( [ r.value ] ), fCols )
                    } )
                    break;
                case 'cols':
                    model.cols.forEach( ( c ) => {
                        this.allocate( c, fRows, fCols.concat( [ c.value ] ) )
                    } )
                    break;
                default:
                    if ( 'object' === typeof model[ key ] ) {
                        this.allocate( model[ key ], fRows.concat( [ model[ key ].value ] ), fCols )
                    }
            }
        }

        let filterList = this.getFilterList( fRows, fCols )
        model.records = this.table.list.filter( ( r ) => {
            return filterList.every( ( f ) => {
                return r[ f.key ] === f.value
            } )
        } )
        // Assigns to this entry the reocrds that match the filter
    }

    getFilterList( fRows, fCols ) {
        let filterList = []

        fRows.forEach( ( f, i ) => {
            filterList.push( { key: this.rows[ i ].key, value: f } )
        } )

        fCols.forEach( ( f, i ) => {
            filterList.push( { key: this.cols[ i ].key, value: f } )
        } )

        return filterList
    }

    calculate( model, headers = null ) {

        if ( null === headers ) headers = this.statsHeaders
        // we want to avoid calling this.statsHeaders every time since it
        // a computed property

        for ( let key in model ) {
            if ( typeof model[ key ] === 'object' && Array.isArray( model[ key ] ) ) {
                model[ key ].forEach( ( m ) => { this.calculate( m, headers ) } )
            }
        }
        // fork cols and rows

        if ( !!model.records ) {
            let stats = { count: model.records.length }
            // Adding number of matching records

            headers.forEach( ( h ) => {
                stats[ h.header ] = Analyzer.analyze( h.type,
                    model.records.map( ( r ) => { return r[ h.header ] } ) )
            } )
            // Based on the type of the values, all values for each header are analysed

            model.stats = stats
        }
        // if the model has records, stats are caluclated
    }

    describe( model, indent ) {

        console.log( "\n---\nMODEL\n".green );
        console.log( JSONHelper.stringify( model ) );
    }

    get statsHeaders() {
        return this.table.headers.filter( ( h ) => {
            let isRows = this.rows.some( ( r ) => {
                return r.key === h.header
            } )
            let isCols = this.cols.some( ( c ) => {
                return c.key === h.header
            } )
            return [ 'date', 'number', 'currency' ].includes( h.type ) || ( !isRows && !isCols )
        } )
    }

    set rows( rows = [] ) {
        let keys = rows.map( ( row ) => { return row.key } )
        if ( !this.table.isHeader( keys ) ) {
            throw "Bad plan. All headers must be valid headers in the file"
        }
        this._rows = rows
    }

    get rows() {
        return this._rows
    }

    set cols( cols ) {
        let keys = cols.map( ( col ) => { return col.key } )
        if ( !this.table.isHeader( keys ) ) {
            throw "Bad plan. All headers must be valid headers in the file"
        }
        this._cols = cols
    }

    get cols() {
        return this._cols
    }
}
