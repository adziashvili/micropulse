import { PipelineStore } from './model'
import { StringHelper as SH, ReportHelper } from '../common'
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

    report() {
        this.rh.addReportTitle()

        console.log( "Total pipeline K USD %s across %d opportunities.",
            SH.addCommas( ( this.store.total / 1000 ).toFixed( 1 ) ),
            this.store.store.length )

        this.reports.forEach( ( r ) => {
            r.report()
        } )
    }

    run() {
        let isSuccess = true

        this.sm.readNewData( this.key )
            .then( ( data ) => {
                if ( data !== null ) {
                    this.store.reconcile( data.getWorksheet( data.worksheets[ 0 ].id ) )
                    this.sm.commit( this.key )
                }
                this.report()

            } ).catch( ( e ) => {
                isSuccess = false
                console.log( "Ooops! We have an Error reading new data.".red );
                console.log( e )
            } )

        return Promise.resolve( isSuccess )
    }
}
