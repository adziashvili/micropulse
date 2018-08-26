import {
    Parser,
    Record,
    StringHelper as SH,
    DateHelper as DH,
    Analyzer as AI
} from '../../common'

export default class Table {

    constructor( isVerbose = false ) {
        this.isVerbose = isVerbose
        this.headers = []
        this.list = []
        this.parser = null
        this.meta = {}
    }

    process( data ) {
        this.parser = new Parser( data )

        Object.assign(
            this.meta,
            this.analyse(), {
                name: this.parser.getReportName(),
                date: this.parser.getReportDate()
            } )

        let { headersRow, firstDataRow, lastDataRow } = this.meta
        
        let headers = this.parser.readRow( 1, headersRow )
        // Read header names

        for ( let i = firstDataRow; i <= lastDataRow; i++ ) {
            let record = new Record()
            let values = this.parser.readRow( 1, i )
            for ( let j = 0; j < values.length; j++ ) {
                record.set( headers[ j ], values[ j ] )
            }
            this.list.push( record )
        }
        // Load all records

        for ( let i = 0; i < headers.length; i++ ) {
            this.headers.push( {
                type: AI.analyzeType( this.parser.readCol( i + 1, firstDataRow, lastDataRow ) ),
                header: headers[ i ]
            } )
        }
        // Guess what type of data is stored in each col

        this.list.forEach( ( r ) => {
            this.transform( r )
        } )
        // transform records according tot the headers type
        if ( this.isVerbose ) {
            this.logDigest()
        }

        this.isInitialised = true
        return this
    }

    isValidHeaders( testHeaders = [] ) {
        return testHeaders.every( ( th ) => {
            return undefined !== this.headers.find( ( h ) => {
                return h.header === th
            } )
        } )
    }

    transform( record ) {
        Object.keys( record ).forEach( ( header ) => {
            let type = this.getType( header )
            switch ( type ) {
                case 'number':
                case 'date':
                    break
                case 'string':
                    let lookup = this.parser.lookupPractice( record.get( header ) )
                    if ( "UNKNOWN" !== lookup ) {
                        record.set( header, lookup )
                    }
                    break
                case 'currency':
                    record.set( header, SH.parseNumber( record.get( header ) ) )
                    break
                case 'boolean':
                    record.set( header, SH.parseBoolean( record.get( header ) ) )
                    break
                default:
                    console.log( type )
                    throw "Oops, UNKNOWN header type:'" + type + "'"
            }
        } )
    }

    getType( header ) {
        let meta = this.headers.find( ( h ) => {
            return h.header === header
        } )
        return meta === undefined ? "UNKNOWN" : meta.type
    }

    values( header, transform = null ) {
        return this.list.map( ( r ) => {
            return transform === null ? r.get( header ) : transform( r.get( header ) )
        } )
    }

    sort( header, data ) {
        if ( this.getType( header ) === 'date' ) {
            return data.sort( ( a, b ) => { return a.valueOf() - b.valueOf() } )
        } else {
            return data
            // return data.sort()
        }
    }

    distinct( header, transform = null ) {

        let data = this.sort( header, this.values( header ) )

        let values = []

        data.forEach( ( d ) => {
            d = transform === null ? d : transform( d )
            if ( !values.includes( d ) ) {
                values.push( d )
            }
        } )

        return values
    }

    analyse() {
        // eg. { headersRow: 14, firstDataRow: 15, lastDataRow: 181 }
        let analysis = { headersRow: -1, firstDataRow: -1, lastDataRow: -1 }

        let filterMarker = "Filtered By:"
        let filterBlank = '   '
        let rowMarker = "Grand Totals"

        let filterRow = this.parser.lookDown( filterMarker, "A" )

        if ( -1 !== filterRow ) {
            // This is first pass for files with filters
            let result = this.parser.lookDownCondition( ( c ) => { return c !== filterBlank }, "A", filterRow + 1 )
            if ( -1 !== result.row ) {
                analysis.headersRow = result.row
                analysis.firstDataRow = result.row + 1
                result = this.parser.lookDownCondition(
                    ( c ) => { return c === null || c.toLowerCase().startsWith( "Grand Totals".toLowerCase() ) },
                    "A", analysis.firstDataRow + 1 )
                if ( -1 !== result.row ) {
                    analysis.lastDataRow = result.row - 1
                }
            }
        } else {
            // TODO: What should we do if there is no filter?
        }

        for ( let key in analysis ) {
            if ( analysis[ key ] === -1 ) {
                console.log( "Analysis of file failed:".red, analysis );
                throw "Analysis of file failed. Unable to detemine " + key
            }
        }

        return analysis
    }

    logDigest() {
        console.log( "\n[MP] Cool! %s records loaded and transformed.".green, this.list.length )
        console.log( "[MP] Detected data schme:".grey )
        console.log( " %s %s".bold, SH.exact( "TYPE", 10 ), "HEADER" )
        this.headers.forEach( ( h ) => {
            console.log( " %s %s".grey, SH.exact( h.type, 10 ), h.header );
        } )
    }

}
