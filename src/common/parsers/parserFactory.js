import BaseExcelParser from './baseExcelParser'
import SFDCExcelParser from './sfdcExcelParser'

const PARSERS = [SFDCExcelParser, BaseExcelParser]

export default class ParserFactory {
  static getParser(exceljsWorkSheet) {
    if (!exceljsWorkSheet) return undefined
    let parser

    for (let i = 0; i < PARSERS.length; i += 1) {
      const CandidateParserClass = PARSERS[i]
      const candidate = new CandidateParserClass(exceljsWorkSheet)
      if (candidate.isCompatible()) {
        parser = candidate
      }
    }

    if (!parser) {
      console.log('WARNING: ParserFactory is unable to find a suitable parser')
    }

    return parser
  }
}
