import { StringHelper, DateHelper, ReportHelper } from '../../common'
import { UtilizationRecord } from '../model'

export default class UtilizationTopBottomReport {

    static get BURNOUT_FLAG() {
        return "*".red.italic
    }

    static get NEW_ENTRANT_HIGH() {
        return "\u25B4".green
    }

    static get NEW_ENTRANT_LOW() {
        return "\u25Be".red
    }

    static get TOP() {
        return "BEST"
    }

    static get BOTTOM() {
        return "WORST"
    }

    constructor( store, type = UtilizationHighLow.TOP ) {
        this.store = store
        this.type = type
        this.leaderboard = []
        this.rh = new ReportHelper(
            type + " MONTHLY PERFORMENCES",
            this.store.date )
        this.position = 0
        this.burnoutAlert = false
        this.newEntrentAlert = false
        this.initialise()
    }

    initialise() {
        let store = this.store
        let date = store.date
        let model = this.type === UtilizationTopBottomReport.TOP ?
            store.top :
            store.bottom

        model.forEach( ( record ) => {
            this.leaderboard.push( this.format( record ) )
        } )
    }

    greenPercent( v, p = 1, suffix = '%' ) {
        return ( this.percent( v, p, suffix ) )
            .green
    }

    redPercent( v, p = 1, suffix = '%' ) {
        return ( this.percent( v, p, suffix ) )
            .red
    }

    percent( v, p = 1, suffix = '%' ) {
        return ( v * 100 )
            .toFixed( p ) + suffix
    }

    format( record ) {
        let dh = new DateHelper( new Date( record.date ) )
        let pad = ( this.position + 1 + "" )
            .length < 2 ?
            " " :
            ""
        let score = this.type === UtilizationTopBottomReport.TOP ?
            this.greenPercent( record.total ) :
            this.redPercent( record.total )

        let str = ( "#" + ++this.position + ". " + pad + record.name )
            .bold + "  \t" +
            score + "\t" + dh.monthYear

        if ( dh.isNew ) {
            str += " " + this.newEntrentSymbole()
            this.newEntrentAlert = true
        }

        if ( record.total > 0.75 ) {
            str += " " + UtilizationTopBottomReport.BURNOUT_FLAG
            this.burnoutAlert = true
        }

        return str
    }

    newEntrentSymbole() {
        return this.type === UtilizationTopBottomReport.TOP ?
            UtilizationTopBottomReport.NEW_ENTRANT_HIGH :
            UtilizationTopBottomReport.NEW_ENTRANT_LOW
    }

    report() {

        this.rh.addReportTitle()
        let qualifier = this.type === UtilizationTopBottomReport.TOP ?
            " best ".green :
            " worst ".red

        this.rh.addSubtitle( "Top " + this.leaderboard.length + qualifier +
            "monthly performances".grey.italic )
        this.leaderboard.forEach( ( leader ) => {
            console.log( leader );
        } )

        if ( this.burnoutAlert ) {
            console.log( "\n%s %s",
                UtilizationTopBottomReport.BURNOUT_FLAG,
                "Too high utilization may burnout Amazonians".grey.italic
            )
        }

        if ( this.newEntrentAlert ) {
            let newline = this.burnoutAlert ?
                "" :
                "\n"

            console.log( "%s%s", newline, this.newEntrentSymbole(),
                "New leaderboard entry".grey.italic )
        }
    }
}
