import { Report } from '../common'

export default class TestPulse extends Report {
  constructor(pathToFile) {
    super({
      file: pathToFile
    })
    this.setup()
  }

  setup() {
    this.cols = [{ key: 'Role' }]
    this.rows = [{ key: 'Name' }]
    this.stats = [{ key: 'Age' }]
  }
}
