import { PipelineStore } from './model'
import { StringHelper as SH, ReportHelper, DateHelper } from '../common'
import { PipelineReport } from './reports'

export default class PipelinePulse {

    constructor( storeManager, date ) {
        this.sm = storeManager
        this.key = PipelineStore.STORE_KEY
        this.store = this.sm.getStore( this.key )
        this.date = date

        this.reports = [ new PipelineReport( this.store ) ]
        this.rh = new ReportHelper( "PIPELINE REPORTS", date )
    }

    report( isVerbose = false ) {
        this.rh.addReportTitle()
        let dh = new DateHelper( this.store.dataRefreshDate )

        console.log( "Total pipeline USD %sK across %d opportunities.",
            SH.toThousands( this.store.total ),
            this.store.store.length )
        console.log( "Pipeline as for:", dh.localeDateString )

        this.reports.forEach( ( r ) => {
            r.report( isVerbose )
        } )
    }

    run( isVerbose = false ) {
        let isSuccess = true

        this.sm.readNewData( this.key )
            .then( ( data ) => {
                if ( data !== null ) {
                    this.store.reconcile( data.getWorksheet( data.worksheets[ 0 ].id ) )
                    this.sm.commit( this.key )
                }
                this.report( isVerbose )

            } ).catch( ( e ) => {
                isSuccess = false
                console.log( "Ooops! We have an Error reading new data.".red );
                console.log( e )
                throw e
            } )

        return Promise.resolve( isSuccess )
    }
}
