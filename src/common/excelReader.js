let Excel = require( 'exceljs' )

export default class ExcelReader {

    constructor( path ) {
        this.wb = null
    }

    read( onReady ) {

        let wb = new Excel.Workbook()
        let promise = wb.xlsx.readFile( file )
            .then( ( value ) => {
                onReady( wb )
            } )
            .catch( () => {
                console.log( "Error" );
            } )
    }
}
