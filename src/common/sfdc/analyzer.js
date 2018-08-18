import { SFDCExcelParserBase as Parser } from '../../common'

export default class Analyzer {

    static analyze( type, values ) {

        switch ( type ) {
            case 'number':
            case 'currency':
            case 'percent':
                return Analyzer.numbers( values )
                break;
            case 'date':
                return Analyzer.dates( values )
                break;
            case 'boolean':
                return Analyzer.booleans( values )
                break;
            default:
                return Analyzer.strings( values )
        }
    }

    static numbers( values ) {
        values = values.map( ( v ) => {
            return Parser.ZERO_OR_MISSING.includes( v ) ? 0 : v
        } )
        let stats = Analyzer.strings( values )
        Object.assign( stats, Analyzer.numerics( values ) )
        return stats
    }

    static dates( values ) {
        let vNums = values.map( ( v ) => {
            return v.valueOf()
        } )
        let stats = Analyzer.numbers( vNums )

        delete stats.sum
        delete stats.avg
        delete stats.avgNonEmpty

        stats.min = new Date( stats.min )
        stats.max = new Date( stats.max )

        return stats
    }

    static booleans( values ) {

        let bNums = values.map( ( v ) => {
            if ( Parser.ZERO_OR_MISSING.includes( v ) ) {
                return 0
            } else {
                return v * 1
            }
        } )

        return Analyzer.numbers( bNums )
    }

    static strings( values ) {
        let stats = {}
        stats.countTotal = values.length
        stats.countDistinct = Analyzer.distinct( values ).count
        stats.countNonEmpty = Analyzer.nonEmpty( values ).count
        return stats
    }

    static distinct( values ) {
        let distinct = []
        values.forEach( ( s ) => {
            if ( !distinct.includes( s ) ) { distinct.push( s ) }
        } )
        return { count: distinct.length, values: distinct }
    }

    static nonEmpty( values ) {
        let nonEmpty = values.filter( ( v ) => { return ![ 0 ].concat( Parser.ZERO_OR_MISSING ).includes( v ) } )
        return { count: nonEmpty.length, values: nonEmpty }
    }

    static numerics( values ) {
        let sum = 0
        let avg = 0
        let avgNonEmpty = 0
        let min = values[ 0 ]
        let max = values[ 0 ]
        let nonEmpty = Analyzer.nonEmpty( values )

        values.forEach( ( v ) => {
            sum += v
            min = v < min ? v : min
            max = v > min ? v : max
        } )

        avg = Analyzer.devide( sum, values.length )
        avgNonEmpty = Analyzer.devide( sum, nonEmpty.count )

        return { sum: sum.toFixed( 2 ), avg, avgNonEmpty, min, max }
    }

    static devide( a, b ) {
        return ( a / ( b === 0 ? 1 : b ) ).toFixed( 2 )
    }

    static isString( data ) {
        return !data.some( ( d ) => {
            return !( typeof d === 'string' )
        } )
    }

    static isCurrency( data ) {

        let sizeOfDashOrNull = data.filter( ( d ) => {
            return Parser.ZERO_OR_MISSING.includes( d )
        } ).length

        if ( sizeOfDashOrNull === data.length ) {
            return false
        }

        return !data.filter( ( d ) => {
            return !Parser.ZERO_OR_MISSING.includes( d )
        } ).some( ( d ) => {
            return !( typeof d === 'string' && d.toLowerCase().trim().startsWith( "usd " ) )
        } )
    }

    static isNumber( data ) {

        let sizeOfDashOrNull = data.filter( ( d ) => {
            return Parser.ZERO_OR_MISSING.includes( d )
        } ).length

        if ( sizeOfDashOrNull === data.length ) {
            return false
        }

        return !data.filter( ( d ) => {
            return !Parser.ZERO_OR_MISSING.includes( d )
        } ).some( ( d ) => {
            return typeof d !== 'number'
        } )
    }

    static isPercent( data ) {
        return !data.some( ( d ) => {
            return !d.toLowerCase().endsWith( "%" )
        } )
    }

    static isDate( data ) {
        return !data.some( ( d ) => {
            let ms = Date.parse( d )
            if ( isNaN( ms ) ) return true
            let date = new Date( ms )
            if ( date.getMonth === undefined ) return true
        } )
    }

    static isBoolean( data ) {
        return !data.some( ( d ) => {
            if ( typeof d === 'boolean' ) {
                return false
            } else if ( typeof d === 'string' ) {
                return !( [ "yes", "no", "true", "false" ].includes( d.toLowerCase() ) )
            } else if ( typeof d === 'number' ) {
                return !( d === 0 || d === 1 )
            } else {
                return true
            }
        } )
    }
}
