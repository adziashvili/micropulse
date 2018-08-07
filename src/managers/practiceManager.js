export default class PracticeManager {

    constructor() {

        this.pdb = [
            { name: "ANZ", sets: [ "APAC", "APJ" ], sfdc: [ "anz" ], isSet: false },
            { name: "ASEAN", sets: [ "APAC", "APJ" ], sfdc: [ "asean" ], isSet: false },
            { name: "INDIA", sets: [ "APAC", "APJ" ], sfdc: [ "india" ], isSet: false },
            { name: "S.KOREA", sets: [ "APAC", "APJ" ], sfdc: [ "s. korea" ], isSet: false },
            { name: "APAC", sets: [ "APJ" ], sfdc: [ "apac" ], isSet: true },
            { name: "JAPAN", sets: [ "APJ" ], sfdc: [ "japan" ], isSet: false },
            { name: "APJ Shared", sets: [ "APJ" ], sfdc: [ "apj shared" ], isSet: false },
            { name: "APJ", sets: [], sfdc: [ "APJ" ], isSet: true },
         ]
    }

    practices( isExcludeSets = false ) {
        return this.names( isExcludeSets ?
            this.pdb.filter( ( p ) => { return !p.isSet } ) :
            this.pdb
        )
    }

    expand( practice ) {
        return this.names( this.pdb.filter( ( p ) => {
            return !p.isSet && ( p.name === practice || p.sets.includes( practice ) )

        } ) )
    }

    names( arr = [], prop = "name" ) {
        return arr.map( ( a ) => {
            return a[ prop ]
        } )
    }

    lookup( sfdcStr = "" ) {
        sfdcStr = ( sfdcStr === null || !sfdcStr ) ? "" : sfdcStr
        let practice = this.pdb.find( ( p ) => {
            return p.sfdc.includes( sfdcStr.toLowerCase() )
        } )
        return !!practice ? practice.name : "UNKNOWN"
    }

}
