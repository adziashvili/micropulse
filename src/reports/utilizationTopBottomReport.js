import { ReportHelper } from '../reports'
import { UtilizationRecord } from '../store'
import { StringHelper, DateHelper } from '../common'

const BURNOUT_FLAG = "*".red.italic
const NEW_ENTRANT_HIGH = "\u25B4".green
const NEW_ENTRANT_LOW = "\u25Be".red

export default class UtilizationTopBottomReport {

    constructor( store, type = UtilizationHighLow.TOP ) {
        this.store = store
        this.type = type
        this.leaderboard = []
        this.rh = new ReportHelper( type + " MONTHLY PERFORMENCES", this.store.date )
        this.position = 0
        this.burnoutAlert = false
        this.newEntrentAlert = false
        this.initialise()
    }

    static get TOP() {
        return "BEST"
    }

    static get BOTTOM() {
        return "WORST"
    }

    initialise() {
        let store = this.store
        let date = store.date
        let model = this.type === UtilizationTopBottomReport.TOP
            ? store.top
            : store.bottom

        model.forEach( ( record ) => {
            this.leaderboard.push( this.format( record ) )
        } )
    }

    format( record ) {
        let dh = new DateHelper( new Date( record.date ) )
        let pad = ( this.position + 1 + "" ).length < 2
            ? " "
            : ""
        let score = this.type === UtilizationTopBottomReport.TOP
            ? ( ( record.total * 100 ).toFixed( 1 ) + "%" ).green
            : ( ( record.total * 100 ).toFixed( 1 ) + "%" ).red

        let str = ( "#" + ++this.position + ". " + pad + record.name ).bold + "  \t" +
                score + "\t" + dh.monthYear

        if ( dh.isNew ) {
            str += " " + this.newEntrentSymbole()
            this.newEntrentAlert = true
        }

        if ( record.total > 0.75 ) {
            str += " " + BURNOUT_FLAG
            this.burnoutAlert = true
        }

        return str
    }

    newEntrentSymbole() {
        return this.type === UtilizationTopBottomReport.TOP
            ? NEW_ENTRANT_HIGH
            : NEW_ENTRANT_LOW
    }

    report() {

        this.rh.addReportTitle()
        let qualifier = this.type === UtilizationTopBottomReport.TOP
            ? " best ".green
            : " worst ".red

        this.rh.addSubtitle( "Top " + this.leaderboard.length + qualifier + "monthly performances".grey.italic )
        this.leaderboard.forEach( ( leader ) => {
            console.log( leader );
        } )

        if ( this.burnoutAlert ) {
            console.log( "\n%s %s", BURNOUT_FLAG, "Too high utilization may burnout Amazonians".grey.italic )
        }

        if ( this.newEntrentAlert ) {
            let newline = this.burnoutAlert
                ? ""
                : "\n"

            console.log( "%s%s", newline, this.newEntrentSymbole(), "New leaderboard entry".grey.italic )
        }
    }
}
