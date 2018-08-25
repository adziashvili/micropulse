export default class Dictionary {

    constructor( dic = [] ) {
        this._dic = []
        this.add( dic )
    }

    get dic() {
        return this._dic
    }

    add( dictionary = [] ) {
        if ( dictionary instanceof Dictionary ) {
          dictionary = dictionary.dic
        }

        dictionary.forEach( ( item ) => {
            this.set( item )
        } )
        return this
    }

    find( key ) {
        return this.dic.find( ( item ) => { return item.key === key } )
    }

    exist( key ) {
        return !!this.find( key )
    }

    get( key, prop = 'shortName' ) {
        let item = this.find( key )
        if ( !item || !Object.keys( item ).includes( prop ) ) {
            return key
        }
        return item[ prop ]
    }

    set( dicObj ) {

        if ( !dicObj || !dicObj.key || !dicObj.shortName ) {
            console.log( "Invalid dictionary item. Ignored".yellow, dicObj );
        }

        let index = this.dic.findIndex( ( item ) => { return item.key === dicObj.key } )

        if ( -1 === index ) {
            this.dic.push( dicObj )
        } else {
            this.dic[ index ] = dicObj
        }
    }
}
