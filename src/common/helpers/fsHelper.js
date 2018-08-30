import JSONHelper from './jsonHelper'

require('colors')

const fs = require('fs')

/**
 * Collection of file systems helper functions.
 * All helper functions are static, use as <i>FSHelper.func()</i>
 */
export default class FSHelper {
  /**
   * Checks if a provided path is either a file or a directory
   *
   * @param {string} path A string to test for being a valid Path
   * @return {Boolean} true if yes; false otherwise
   */
  static isValidPath(path, isTryDirName = true) {
    try {
      const stats = fs.statSync(path)
      return stats.isFile() || stats.isDirectory()
    } catch (err) {
      if (isTryDirName) {
        return FSHelper.isValidPath(path.substring(0, Math.max(path.lastIndexOf('/'), 0)), false)
      }
      console.log('WARNING: Path: %s is not a file or a directory.'.yellow,
        path);
      return false
    }
  }

  /**
   * Lists a directory
   *
   * @param {string} path Path to directory
   *
   * @return {array} Array of files
   */
  static listdirectory(path) {
    let files = []

    try {
      files = fs.readdirSync(path)
    } catch (err) {
      console.error('Error listing files for %s'.red, path);
    }

    return files
  }

  /**
   * Get time since when a directry was last modified
   *
   * @param {[type]} fileName       Path to file
   * @param {[type]} onErrorRetVal  Value to return in case file does not exist
   *                                Omit for now.
   *
   * @return {[type]} [description]
   */
  static getLastModifiedMs(fileName, onErrorRetVal) {
    try {
      const stats = fs.statSync(fileName)
      return new Date(stats.mtime).getTime()
    } catch (err) {
      console.error(err);
      if (onErrorRetVal) {
        return onErrorRetVal
      }
      return Date.now()
    }
  }

  /**
   * Saves a JS object to a json file.
   *
   * @param {object}  obj           Object to save
   * @param {string}  fileName      The destination file name
   * @param {Boolean} [pretty=true] True for pretty json
   *
   * @return {void}  Nothing.
   */
  static save(obj, fileName, pretty = true) {
    if (!obj) {
      throw new Error('Object is undefined')
    } else if (!fileName) {
      throw new Error('fileName is undefined')
    } else if (!fs) {
      throw new Error('System error. fs is undefined')
    } else {
      fs.writeFile(fileName, JSONHelper.stringify(obj, pretty),
        (err) => {
          if (err) {
            return console.log('Failed to save file\n'.red,
              err);
          }
          console.log("Saved /'%s/'".grey.italic, fileName)
          return false
        })
    }
  }

  /**
   * Renames a file synchroniously.
   *
   * @param {[type]}  fileName        Full or relative ( resolvable ) path to the file who's
   * @param {[type]}  newFileName     New full or relative  ( resolvable ) path
   * @param {Boolean} [verbose=false] If true prints the source and desitnation file names
   *
   * @return {[type]}  [description]
   */
  static rename(fileName, newFileName, verbose = false) {
    if (!newFileName) {
      throw new Error('newFileName is undefined')
    } else if (!fileName) {
      throw new Error('fileName is undefined')
    } else if (!fs) {
      throw new Error('System error. fs is undefined')
    } else {
      fs.renameSync(fileName, newFileName)
      if (verbose) {
        console.log('Renamed %s -> %s'.italic.grey,
          FSHelper.fileName(fileName),
          FSHelper.fileName(newFileName));
      }
    }
  }

  static readFile(filePath) {
    if (!filePath) {
      throw new Error('filePath is undefined')
    } else if (!fs) {
      throw new Error('System error. fs is undefined')
    }
    return fs.readFileSync(filePath, 'utf8')
  }

  /**
   * Return the file name in a path
   *
   * @param {String} path Something like "/foo/bar/file.js"
   *
   * @return {String} Return the file name i.e. file.js in the example above.
   */
  static fileName(path) {
    if (!path || path === null) {
      return ''
    }

    return path.lastIndexOf('/') === -1 ? path : path.substring(path.lastIndexOf('/'))
  }

  /**
   * Adds a suffic to a file name in the form of <file_name>.prefix.D_YYYY_M_DD_T_HH_MM_SS__SSS
   *
   * @param {String} fileName File name to process
   * @param {String} prefix   Adds the prefix before the date pattern
   *
   * @return {[type]} [description]
   */
  static touchName(fileName, prefix) {
    const d = new Date(Date.now())
    return `${fileName} .${prefix}
    .D_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}
    _T_${d.getHours()}_${d.getMinutes()}_${d.getSeconds()}
    __${d.getMilliseconds()}`
  }
}
