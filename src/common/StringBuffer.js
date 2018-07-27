export default class StringBuffer {
    constructor( str ) {
        this._buffer = []

        if ( !!str ) {
            this._buffer.push( str )
        }
    }

    append( s ) {
        this._buffer.push( s )
        return this
    }

    toString() {

        let str = ""

        this._buffer.forEach( ( s ) => {
            str += s
        } )

        return str
    }
}
