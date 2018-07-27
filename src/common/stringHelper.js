const assert = require( 'assert' )

export default class StringHelper {

    /**
     * Default suffic: '...'
     *
     * @type {String}
     */
    static get SUFFIX() {
        return '...'
    }

    /**
     * Default padding char: ' '
     *
     * @type {String}
     */
    static get PADDING_CHAR() {
        return ' '
    }

    /**
     * Default padding length: 20
     *
     * @type {String}
     */
    static get DEFAULT_MAX_PADDING() {
        return 20
    }

    /**
     * Returns exactly a string in with length equals to max.
     * If the provided str is shorter than that then c is used to padd the rest.
     * If it is longer than max, then a suffic StringHelper.SUFFIX is added at the end.
     *
     * @param {String} [str='']                               String to process.
     * @param {[type]} [max=StringHelper.DEFAULT_MAX_PADDING] Defines the length to target. Defaults to 20
     * @param {[type]} [c=StringHelper.PADDING_CHAR]          Defines what chart to padd in case str is shorter than max. Default is ' '
     *
     * @return {[type]} [description]
     */
    static exact(
        str = '',
        max = StringHelper.DEFAULT_MAX_PADDING, c =
        StringHelper.PADDING_CHAR ) {

        let fixed = str + ''

        if ( str.length > max ) {
            fixed = fixed.substring( 0, max )
            if ( max > StringHelper.SUFFIX.length ) {
                fixed = fixed.substring( 0, max - StringHelper.SUFFIX.length ) +
                    StringHelper.SUFFIX
            }
        } else {
            fixed = str + ( Array( max - fixed.length + 1 )
                .join( c ) )
        }

        assert( fixed.length === max, 'exact: We have a bug...' )

        return fixed
    }
}
