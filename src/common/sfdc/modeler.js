import {
    JSONHelper,
    Analyzer
} from '../../common'

export default class Modeler {

    constructor( table ) {
        this.table = table
        this.model = {}
        this.rows = []
        this.cols = []
        this.stats = []
    }

    build() {
        let model = {}
        this.construct( model )
        this.allocate( model )
        this.calculate( model )
        // this.describe( model )
        this.model = model
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

        let { key, transform } = cols[ 0 ]
        let type = this.table.getType( key )
        let values = this.table.distinct( key, transform )

        data.cols = []
        values.forEach( ( value ) => {
            data.cols.push( { key, value, type, rows: [] } )
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

        let { key, transform } = rows[ 0 ]
        let type = this.table.getType( key )

        if ( !!data.rows ) {
            let values = this.table.distinct( key, transform )
            values.forEach( ( value ) => {
                let [ , ...next ] = rows
                let newRow = { key, value, type, rows: [] }
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

    /**
     * Returns the transform function for a specfic key.
     *
     * @param {String} colKey Key
     *
     * @return {function} If found, the transform function is returned. Null otherwise
     */
    transformer( colKey ) {
        let { cols } = this
        let col = cols.find( ( c ) => { return c.key === colKey } )
        if ( col !== undefined ) {
            return col.transform
        }

        let { rows } = this

        let row = rows.find( ( r ) => { return r.key === colKey } )
        if ( row !== undefined ) {
            return row.transform
        }

        return null
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
                let transformer = this.transformer( f.key )
                return transformer !== null ?
                    transformer( r[ f.key ] ) === f.value :
                    r[ f.key ] === f.value
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

    describeAspects( strKey ) {
        let description = []
        this[ strKey ].forEach( ( aspect ) => {
            let distinctValues = this.table.distinct( aspect.key, this.transformer( aspect.key ) )
            let maxStringLength = Math.max( ...distinctValues.map( ( v ) => { return ( "" + v ).length } ) )
            let count = distinctValues.length
            description.push( { key: aspect.key, count, maxStringLength, distinctValues } )
        } )
        return description
    }

    expand( model, prop, prev = [], kvps = [] ) {

        if ( !!model[ prop ] && model[ prop ].length > 0 ) {
            model[ prop ].forEach( ( item ) => {
                let newPrev = model.key === 'root' ? prev : prev.concat( [ { key: model.key, value: model.value } ] )
                this.expand( item, prop, newPrev, kvps )
            } )
        } else {
            kvps.push( prev.concat( [ { key: model.key, value: model.value } ] ) )
        }

        return kvps
    }

    find( key, rows = [], cols = [] ) {

        let model = this.model

        if ( cols.length > 0 ) {
            model = this.filter( 'cols', cols, model )
        }

        if ( undefined === model ) return undefined

        if ( rows.length > 0 ) {
            model = this.filter( 'rows', rows, model )
        }

        return undefined === model ? undefined : model[ key ]
    }

    filter( key, kvp = [], model = {} ) {

        if ( kvp.length === 0 ) return model

        let condition = kvp[ 0 ]
        model = model[ key ].find( ( m ) => {
            return m.key === condition.key && m.value === condition.value
        } )

        if ( undefined === model ) {
            return undefined
        }

        if ( kvp.length > 1 ) { // being asked to go one level deeper
            if ( !model[ key ] ) return undefined
            let [ , ...next ] = kvp
            model = this.filter( key, next, model )
        }

        return model
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
        if ( rows.length > 0 ) {
            let keys = rows.map( ( row ) => { return row.key } )
            if ( !this.table.isHeader( keys ) ) {
                throw "Invalid rows: All headers must be valid headers in the file"
            }
        }
        this._rows = rows
    }

    get rows() {
        return this._rows
    }

    set cols( cols ) {
        if ( cols.length > 0 ) {
            let keys = cols.map( ( col ) => { return col.key } )
            if ( !this.table.isHeader( keys ) ) {
                throw "Invalid cols: All headers must be valid headers in the file"
            }
        }
        this._cols = cols
    }

    get cols() {
        return this._cols
    }

    set stats( stats ) {
        if ( stats.length > 0 &&
            !this.table.isHeader( stats.map( ( s ) => { return s.key } ) ) ) {
            throw "Invalid cols: All headers must be valid headers in the file"
        }
        this._stats = stats
    }

    get stats() {
        return this._stats
    }

    get table() {
        return this._table
    }

    set table( table ) {
        this._table = table
    }

    set model( model ) {
        this._model = model
    }

    get model() {
        return this._model
    }
}
