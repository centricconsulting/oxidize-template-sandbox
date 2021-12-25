import fs, {existsSync} from 'fs'
import path from 'path'
import beautify from 'json-beautify'

export default class Asset {
  constructor(filePath, rootPath) {
    this.filePath = filePath
    this.rootPath = rootPath ?? ''
  }

  rootPath
  #writeStream
  #filePath
  #pathExists

  get filePath() {
    return this.#filePath
  }

  set filePath(value) {
    this.#filePath = value
    this.#writeStream = undefined
    this.#pathExists = undefined
  }

  #assertOpenFileStream() {
    const completeFilePath = this.rootPath.concat('/').concat(this.filePath)

    if (!this.#pathExists) {
      Asset.assertPathExists(completeFilePath)
      this.#pathExists = true
    }

    if (!this.#writeStream) {
      this.#writeStream = fs.createWriteStream(completeFilePath)
    }
  }

  writeJsonFile(json) {
    const text = beautify(json, null, 2, 100)
    this.writeFile(text)
  }

  writeFile(text) {
    this.writeText(text)
    this.saveFile()
  }

  static FILEFORMAT = {TSV: 'tsv', CSV: 'csv'}

  /**
   *
   * @param {*} records
   * @param {*} delimiter
   * @param {*} header Json object where each key has a corresponding value equal to a record key.
   */
  writeDelimitedFile(records, fileFormat, includeHeader = true, header) {
    if (!records || records.length === 0) {
      this.saveFile()
      return
    }

    // determine if a header is required
    let lineText
    if (includeHeader) {
      if (!header) {
        const firstRecord = records[0]
        header = {}
        //generate the header from the first record
        for (const key in firstRecord) {
          header[key] = key
        }
      }
      lineText = this.#buildDelimitedLine(header, fileFormat, header) // record is header
      this.writeLine(lineText)
    }

    for (let r = 0; r < records.length; r++) {
      const record = records[r]
      lineText = this.#buildDelimitedLine(record, fileFormat, header)
      this.writeLine(lineText)
    }

    this.saveFile()
  }

  #buildDelimitedLine(record, fileFormat, header) {
    let delimiter
    switch (fileFormat) {
      case Asset.FILEFORMAT.TSV:
        delimiter = '\t'
        break
      case Asset.FILEFORMAT.CSV:
        delimiter = ','
        break
      default:
        throw new Error(`Invalid file format was specified: \"${fileFormat}\".`)
    }

    const rowValues = []
    for (let headerKey in header) {
      const recordKey = header[headerKey]
      const value = this.#buildDelimitedValue(record[recordKey], fileFormat)
      rowValues.push(value)
    }
    return rowValues.join(delimiter)
  }

  static TsvEscapeChars = [
    {character: '\\b', replace: '\\x08'},
    {character: '\\f', replace: '\\x0C'},
    {character: '\\n', replace: '\\x0A'},
    {character: '\\t', replace: '\\x09'},
    {character: '\\r', replace: '\\x0D'},
    {character: '\\v', replace: '\\x0B'},
    {character: '\\b', replace: '\\x08'},
    {character: '\\', replace: '\\x5C'},
    {character: '"', replace: '\\x22'},
  ]

  #buildDelimitedValue(value, fileFormat) {
    switch (fileFormat) {
      case Asset.FILEFORMAT.TSV:
        // replace TSV escape character with coding
        for (let e = 0; e < Asset.TsvEscapeChars.length; e++) {
          const escape = Asset.TsvEscapeChars[e]
          value = value.replace(new RegExp(escape.character, 'g'), escape.replace)
        }
        break

      case Asset.FILEFORMAT.CSV:
        // test for any characters requiring surround quotes
        if (/(,|\\b|\\f|\\r|\\t|\\v|\\|\n|\")/.test(value)) {
          value = value.replace(/"/g, '""') // replace quote with double-quote
          value = '"'.concat(value).concat('"') // surround with quotes
        }
        break
      default:
        throw new Error(`Invalid file format was specified: ${fileFormat}.`)
    }

    return value
  }

  writeLine(text) {
    this.writeText(text.concat('\n'))
  }

  writeText(text, encoding) {
    if (!encoding) encoding = 'utf-8'
    this.#assertOpenFileStream()
    this.#writeStream.write(text, encoding)
  }

  saveFile() {
    if (this.#writeStream) {
      this.#writeStream.end()
      this.#writeStream = undefined
      this.#pathExists = undefined
    }
  }

  static assertPathExists(filePath) {
    let folderPath = path.dirname(filePath)
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, {recursive: true}, (err) => {
        if (err) throw err
      })
    }
  }
}
