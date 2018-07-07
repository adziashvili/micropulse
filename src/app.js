import { StoreManager, UtilizationRecord, UtilizationStore } from './store'

let sm = new StoreManager()
let store = sm.utilizationStore

let ur1 = new UtilizationRecord( UtilizationRecord.TYPE_YTD, "APAC", "04 Dec 1995 00:12:00 GMT", 0.11, 0.11 )
let ur2 = new UtilizationRecord( UtilizationRecord.TYPE_YTD, "APAC", "04 Dec 1995 01:12:00 GMT", 0.22, 0.33 )

console.log( "\nAdding reocrd" )
console.log( ur1 )
store.addRecord( ur1 )

console.log( "\nAdding reocrd 2" )
console.log( ur2 )
store.addRecord( ur2 )

console.log( "\nGetting reocrd" )
console.log( store.getRecords( UtilizationRecord.TYPE_YTD, "APAC" ) );

console.log( "\nGetting latest for 1995 12" )
console.log( store.getLatest( UtilizationRecord.TYPE_YTD, "APAC", 1995, 12 ) );
