import {
    JSONHelper
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
        return model
    }

    construct( model ) {
        model.header = { key: 'root', value: 'root' }
        model.rows = {}

        this.addCols( model, this.cols )
        this.addRows( model, this.rows )
    }

    addCols( data, cols ) {
        if ( cols.length === 0 ) return
        // nothing to add

        let { key } = cols[ 0 ]
        let values = this.table.distinct( key )
        data.cols = []
        values.forEach( ( g ) => {
            data.cols.push( { header: { key: key, value: g }, rows: {} } )
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
                data.rows[ value ] = {}
                this.addRows( data.rows[ value ], next )
            } )
        } else if ( typeof data === 'object' ) {
            let values = this.table.distinct( key )
            values.forEach( ( value ) => {
                data[ value ] = {}
                let [ , ...next ] = rows
                this.addRows( data[ value ], next )
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
                case 'header':
                    break;
                case 'rows':
                    for ( let key in model.rows ) {
                        this.allocate( model.rows[ key ], fRows.concat( [ key ] ), fCols )
                    }
                    break;
                case 'cols':
                    model.cols.forEach( ( c ) => {
                        this.allocate( c, fRows, fCols.concat( [ c.header.value ] ) )
                    } )
                    break;
                default:
                    if ( 'object' === typeof model[ key ] ) {
                        this.allocate( model[ key ], fRows.concat( [ key ] ), fCols )
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

    calculate( model ) {

        // All the is left is to calculate the
        // model every where there is a list
    }

    describe( model, indent = " " ) {
        console.log( "\n---\nMODEL\n".green );
        console.log( JSONHelper.stringify( model ) );
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
