import { PipelineStore } from './model'
import { ReportHelper } from '../common'

export default class PipelinePulse {

    constructor( storeManager, date ) {
        this.sm = storeManager
        this.key = PipelineStore.STORE_KEY
        this.store = this.sm.getStore( this.key )
        this.date = date

    }

    report() {
        let rh = new ReportHelper( "PIPELINE REPORT" )
        rh.addReportTitle()
        console.log( "COUNT OF RECORDS: %d", this.store.store.length );
        console.log("\n");
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
