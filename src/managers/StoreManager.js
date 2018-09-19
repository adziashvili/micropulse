import { ExcelReader, FSHelper } from 'ika-helpers'

const path = require('path')

const _STORAGE_ROOT = '../../data'
const _ARCHIVE_FOLDER = 'archive'

export default class StoreManager {
  static get STORAGE_ROOT_PATH() {
    return path.join(__dirname, _STORAGE_ROOT)
  }

  static get ARCHIVE_FOLDER() {
    return _ARCHIVE_FOLDER
  }

  static path(fileName) {
    return path.join(
      StoreManager.STORAGE_ROOT_PATH,
      fileName
    )
  }

  get CURRENT_DATA_FILE() {
    return 1
  }

  get NEW_DATA_FILE() {
    return 2
  }

  get DATA_STORE() {
    return 1
  }

  get ARCHIVE_STORE() {
    return 2
  }

  constructor(practiceManager) {
    this._pm = practiceManager
    this._stores = [
    //   {
    //   key: UtilizationStore.STORE_KEY,
    //   store: new UtilizationStore(this.pm),
    //   path: UTILIZATION_DB,
    //   newDataFileName: UTILIZATION_NEW_DATA_FILE
    // }
  ]

    this.stores.forEach((s) => {
      s.store.initialise(require(StoreManager.path(s.path)))
    })
  }

  get pm() {
    return this._pm
  }

  set pm(pm) {
    this._pm = pm
  }

  get stores() {
    return this._stores
  }

  get keys() {
    return this.stores.map(store => store.key)
  }

  getStore(key) {
    const storeEntry = this.getStoreEntry(key)
    return storeEntry !== null ? storeEntry.store : null
  }

  getStoreEntry(key) {
    const matchingStores = this.stores.filter(store => store.key === key)
    return matchingStores.length === 1 ? matchingStores[0] : null
  }

  buildAll(names, date) {
    this.stores.forEach((s) => {
      s.store.build(names, date)
    })
  }

  hasNewData(key) {
    const dir = FSHelper.listdirectory(StoreManager.STORAGE_ROOT_PATH)
    const storeEntry = this.getStoreEntry(key)
    return dir.includes(storeEntry.newDataFileName)
  }

  readNewData(key) {
    const storeEntry = this.getStoreEntry(key)

    if (storeEntry === null) {
      throw new Error(`Error: Invalid key '${key}'`)
    }

    if (!this.hasNewData(key)) {
      return Promise.resolve(null)
    }
    console.log('[MP] New data is avaiallbe for %s. Processing...'.yellow, key);

    return ExcelReader.load(
      this.getStoragePath(storeEntry.key, this.NEW_DATA_FILE, this.DATA_STORE)
    )
  }

  getStoragePath(key, fileType, storageType) {
    const store = this.getStoreEntry(key)
    // Getting the store entry

    const file = fileType === this.CURRENT_DATA_FILE ? store.path : store.newDataFileName
    // selecting the file requested based on file type

    let filePath = StoreManager.STORAGE_ROOT_PATH
    // All files reside under root

    if (storageType === this.ARCHIVE_STORE) {
      filePath = path.join(filePath, StoreManager.ARCHIVE_FOLDER)
      // incase archive folder needed, adding the path under root
    }

    return path.join(filePath, file)
    // lastly, adding the file name to the selected path
  }

  commit(key) {
    const store = this.getStoreEntry(key)

    // backup utilization store db
    const dataFile = this.getStoragePath(key, this.CURRENT_DATA_FILE, this.DATA_STORE)
    const dataFileArchive = this.getStoragePath(key, this.CURRENT_DATA_FILE, this.ARCHIVE_STORE)

    FSHelper.rename(
      dataFile,
      FSHelper.touchName(dataFileArchive, 'back'), true
    )

    // backup input file
    const inputFile = this.getStoragePath(key, this.NEW_DATA_FILE, this.DATA_STORE)
    const inputFileArchive = this.getStoragePath(key, this.NEW_DATA_FILE, this.ARCHIVE_STORE)

    FSHelper.rename(
      inputFile,
      FSHelper.touchName(inputFileArchive, 'back'), true
    )

    // Save new data
    FSHelper.save(store.store, dataFile)
  }

  saveStore(key) {
    const storeEntry = this.getStoreEntry(key)
    if (storeEntry !== null) {
      FSHelper.save(storeEntry.store, StoreManager.path(storeEntry.path))
    }
  }

  save() {
    for (const key of this.keys) {
      this.saveStore(key)
    }
  }
}
