import { StringHelper, ReportHelper } from '../../common'
import { UtilizationRecord } from '../model'

export default class UtilizationAboveSixtyReport {

    constructor( store, type ) {
        this.store = store
        this.type = type
        this.leaderboard = []
        this.rounds = this.store.date.getMonth()
        this.rh = new ReportHelper( type + " ABOVE 60% LEADERBOARD", this.store
            .date )
        this.initialise()
    }

    initialise() {
        let store = this.store
        let model = this.type === UtilizationRecord.TYPE_YTD ?
            store.ytd :
            store.monthly
        let date = store.date

        store.names.forEach( ( name ) => {
            this.leaderboard.push( { name: name, score: 0 } )
        } )

        store.names.forEach( ( name ) => {

            for ( let m = 0; m < date.getMonth(); m++ ) {
                if ( model[ name ][ "Total" ][ m ] >= 0.6 ) {

                    this.leaderboard.find( ( candidate ) => {
                            return candidate.name === name
                        } )
                        .score++
                }
            }
        } )

        this.leaderboard.sort( ( a, b ) => {
            return a.score < b.score
        } )
    }

    report() {
        this.rh.addReportTitle()
        this.rh.addSubtitle( "Times " + this.type +
            " utilization was above 60%" )

        let i = 0
        let leader = 1

        while ( i < this.leaderboard.length && this.leaderboard[ i ].score >
            0 ) {

            let position = i > 0 && this.leaderboard[ i ].score === this.leaderboard[
                    i - 1 ].score ?
                position = "" :
                position = "#" + ( leader++ ) + "."

            position = StringHelper.exact( position, 3 )
                .bold
            console.log( "%s %s", position, this.addPosition( this.leaderboard[
                i ] ) );

            i++
        }
    }

    addPosition( leader ) {
        let successRatio = leader.score / this.rounds * 100

        return StringHelper.exact( leader.name, 10 )
            .bold + leader.score + " times" +
            "\t(" + successRatio.toFixed( 1 ) + "% of " + this.rounds +
            " rounds)"
    }
}
