export default class DataManager {

    constructor(  ) {
        this.name = "DataManager"
    }

    set name ( n ) {
      this._name = n
    }

    get name () {
        return this._name
    }
}
