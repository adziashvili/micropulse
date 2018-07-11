const assert = require( 'assert' )

const U_PAD_LEN = 20
const U_PAD_CHAR = ' '
const SUFFIX = '...'

export default class StringHelper {
    static padOrTrim( str = '', max = U_PAD_LEN, c = U_PAD_CHAR ) {

        let fixed = str + ''

        if ( str.length > max ) {
            fixed = fixed.substring( 0, max )
            if ( max > SUFFIX.length ) {
                fixed = fixed.substring( 0, max - SUFFIX.length ) + SUFFIX
            }
        } else {
            fixed = str + ( Array( max - fixed.length + 1 ).join( c ) )
        }

        assert( fixed.length === max, 'padOrTrim: We have a bug...' )

        return fixed
    }
}
