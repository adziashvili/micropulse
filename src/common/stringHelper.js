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
     * Returns exactly a string in with length equals to max (default 20).
     *
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
        max = StringHelper.DEFAULT_MAX_PADDING,
        c = StringHelper.PADDING_CHAR,
        isPrefix = false ) {

        let fixed = str + ''

        if ( str.length > max ) {
            fixed = fixed.substring( 0, max )
            if ( max > StringHelper.SUFFIX.length ) {
                fixed = fixed.substring( 0, max - StringHelper.SUFFIX.length ) +
                    StringHelper.SUFFIX
            }
        } else {
            let padding = Array( max - fixed.length + 1 ).join( c )
            fixed = !isPrefix ? str + padding : padding + str
        }

        assert( fixed.length === max, 'exact: We have a bug with...' + fixed + ': ' + fixed.length + '!=' + max )

        return fixed
    }

    /**
     * Adds a prefix to a string up to a specfiied length.
     *
     * e.g. prefix ("Hi", 5, "Z") will result in "ZZZHi"
     *
     * @param {String} [str='']                               String to pad.
     * @param {[type]} [max=StringHelper.DEFAULT_MAX_PADDING] Total final length desired. Includes Str and prefix added.
     * @param {[type]} [c=StringHelper.PADDING_CHAR]          What character to add as prefix.
     *
     * @return {[type]} [description]
     */
    static prefix(
        str = '',
        max = StringHelper.DEFAULT_MAX_PADDING,
        c = StringHelper.PADDING_CHAR ) {

        return StringHelper.exact( str, max, c, true )
    }

    /**
     * Parses a number string.
     *
     * @param {String} [value="0.00"]                     Value to parse. Can be string or numeric.
     * @param {String} [currencyPrefix="USD "]            When it a string, currency will be trimmed
     *
     * @return {number} Float number representing the value parsed
     */
    static parseNumber( value = "0.00", currencyPrefix = "USD " ) {

        let tmpVal = ( "-" === value || "" === value ) ? "0.00" : value

        if ( 'string' === typeof tmpVal ) {

            if ( tmpVal.startsWith( currencyPrefix ) ) {
                tmpVal = tmpVal.substring( currencyPrefix.length )
            }
            // remove currency prefix

            tmpVal = tmpVal.replace( new RegExp( ',', 'g' ), "" )
            // just in case, since Number.parseFloat() trims on ,
        }

        return Number.parseFloat( tmpVal )
    }

    /**
     * Parses a percent string.
     *
     * String value can have '%' as a suffix.
     * When number is passed, it will be return as a float.
     *
     * @param {String}  [value="0%"]       Value to parse
     * @param {Boolean} [bScaleToOne=true] If true, percent will be scaled to a numebr between 0..1
     *
     * @return {number}  Percent numeric value
     */
    static parsePercent( value = "0%", bScaleToOne = true ) {
        let tmpVal = ( "-" === value || "" === value ) ? "0%" : value

        if ( 'string' === typeof tmpVal ) {
            tmpVal = tmpVal.replace( "%", "" )
            // removing the % sign if it is included
        }

        let percent = Number.parseFloat( tmpVal )

        if ( bScaleToOne && percent > 1 ) {
            percent = percent / 100
        }

        return percent
    }

    /**
     * Parses a a boolean value.
     *
     * @param {String} [value=""] Value to parse.
     *
     * @return {boolean} If value is tring, returns true if lower ccase
     *                   value matches "yes", "true" or "1".
     *
     *                   If value is boolean, it is returned as is.
     */
    static parseBoolean( value = "" ) {

        if ( 'boolean' === typeof value ) {
            return value
        }

        let v = value.toLowerCase()

        return ( "yes" === v || "true" === v || "1" === v )
    }

    /**
     * Returns a number with commans.
     *
     * e.g. addCommas (10000.321) will return "10,000.321"
     *
     * @param {number} x A number
     *
     * @return {string} Commas seperated by thousands
     */
    static addCommas( x ) {
        var parts = x.toString().split( "." );
        parts[ 0 ] = parts[ 0 ].replace( /\B(?=(\d{3})+(?!\d))/g, "," );
        return parts.join( "." );
    }
}
