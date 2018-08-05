const assert = require( 'assert' )

import { SFDCExcelParserBase } from '../../common'
import PipelineRecord from './pipelineRecord'

export default class PipelineParser extends SFDCExcelParserBase {

    constructor( data ) {
        super( data )
    }

    parse() {
        let headerRow = this.scanDown( "Practice" )
        assert.notEqual( headerRow, this.NOT_FOUND, "Bad inputs file. Can't find header row." )

        let totalsRow = this.scanDown( "Grand Totals" )
        assert.notEqual( totalsRow, this.NOT_FOUND, "Bad inputs file. Can't find totals row." )

        let dataRow = headerRow + 1

        while ( dataRow < totalsRow ) {
            this.records.push( new PipelineRecord( this.readValues( 1, dataRow++ ) ) )
        }

        return this.records
    }

}
