import { ReportHelper } from '../reports'
import { StringHelper } from '../common'

export default class UtilizationTripleGreenReport {

    constructor( store ) {
        this.store = store
        this.leaderboard = []
        this.rounds = this.store.date.getMonth()
        this.rh = new ReportHelper( "TRIPLE GREEN LEADERBOARD", this.store.date )
        this.initialise()
    }

    initialise() {
        let store = this.store
        let monthly = store.monthly
        let date = store.date

        store.names.forEach( ( name ) => {
            this.leaderboard.push( { name: name, score: 0 } )
        } )

        store.names.forEach( ( name ) => {
            for ( let m = 0; m < date.getMonth(); m++ ) {
                if ( monthly[ name ][ "Billable" ][ m ] >= 0.4 && monthly[ name ][ "Investment" ][ m ] >= 0.2 ) {
                    this.leaderboard.find( ( candidate ) => {
                        return candidate.name === name
                    } ).score++
                }
            }
        } )

        this.leaderboard.sort( ( a, b ) => {
            return a.score < b.score
        } )
    }

    report() {
        this.rh.addReportTitle()
        let i = 0, leader = 1

        while ( i < this.leaderboard.length && this.leaderboard[ i ].score > 0 ) {

            let position = i > 0 && this.leaderboard[ i ].score === this.leaderboard[i - 1].score
                ? position = ""
                : position = "#" + ( leader++ ) + "."

            position = StringHelper.padOrTrim( position, 3 ).bold
            console.log( "%s %s", position, this.addPosition( this.leaderboard[ i ] ) );

            i++
        }
    }

    addPosition( leader ) {
        let successRatio = leader.score / this.rounds * 100

        return StringHelper.padOrTrim( leader.name, 10 ).bold + leader.score + " times" +
                "\t(" + successRatio.toFixed( 1 ) + "%, " + this.rounds + " rounds)"
    }
}
