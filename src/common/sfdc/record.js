export default class Record {

    constructor() {}

    exist( key ) {
        return Object.keys( this ).includes( key )
    }

    set( key, value ) {
        this[ key ] = value
    }

    get( key ) {
        return this[ key ]
    }
}
