import { Parser } from '../../../common'
import PipelineRecord from './pipelineRecord'

const assert = require('assert')

export default class PipelineParser extends Parser {
  constructor(data) {
    super(data)
  }

  parse() {
    const headerRow = this.lookDown('Practice')
    assert.notEqual(headerRow, this.NOT_FOUND, 'Bad inputs file. Can\'t find header row.')

    const totalsRow = this.lookDown('Grand Totals')
    assert.notEqual(totalsRow, this.NOT_FOUND, 'Bad inputs file. Can\'t find totals row.')

    let dataRow = headerRow + 1

    while (dataRow < totalsRow) {
      const data = this.readRow(1, dataRow)
      dataRow += 1
      // read all data

      if (data.length > 0) {
        data[0] = this.lookup(data[0])
      }
      // fix SFDC name

      this.records.push(new PipelineRecord(data))
    }

    return this.records
  }

  get date() {
    return this.getReportDate()
  }
}
