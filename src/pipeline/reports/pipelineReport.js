import { ReportHelper, StringBuffer, StringHelper } from '../../common'

export default class PipelineReport {

    constructor( store ) {
        this.store = store
        this.rh = new ReportHelper( "PIPELINE" )
        this.stages = this.store.stages.concat( "Total" )
    }

    report() {
        this.rh.addReportTitle()

        this.store.monthly.forEach( ( p ) => {
            if ( p.practice === "APJ Shared" ) return
            console.log( "\n" + p.practice.bold );
            this.stages.forEach( ( s ) => {
                let sb = new StringBuffer( "  " )
                sb.append( StringHelper.exact( s, 22 ).italic.grey )
                p.months.forEach( ( m ) => {
                    let str = StringHelper.prefix( this.kValue( m[ s ].value ), 10 )
                    sb.append( this.redIfZero( m[ s ].value, str ) )
                } )
                console.log( this.boldIf( sb.toString(), s === "Total" ) );
            } )
        } )
    }

    kValue( num ) {
        return ( num / 1000 ).toFixed( 1 )
    }

    redIfZero( num, str ) {
        return num === 0 ? str.red : str
    }

    boldIf( str, condition ) {
        return condition ? str.bold : str
    }
}
