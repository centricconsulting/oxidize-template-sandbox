import ejs from 'ejs'
import Asset from './core/asset.js'
import codifier from '../src/core/codifier.js'
import jsonHelper from './core/json.helper.js'

/**
 * This class must be derived from the GeneratorBase class and the class name must remain "Generator".
 * @param {JSON} payload JSon object containing all nececessary information to create the asset.  The payload follows a specific structure (see core/examples.js).
 */
export default class CodeGenerator {
  constructor(payloadJson, templateScript, targetFolderPath) {
    this.payloadJson = payloadJson
    this.templateScript = templateScript
    this.targetFolderPath = targetFolderPath
  }

  payloadJson
  templateScript
  targetFolderPath

  static FileSplitRegex = /(?:^@@@FILE:\[(?<path>[\S ]+)\]@@@$)/gm

  generate() {
    // global makes it possible to see these libraries in EJS
    global.jsonHelper = jsonHelper
    global.codifier = codifier
    // generate raw output
    const script = ejs.render(this.templateScript, this.payloadJson)

    // split into files
    const fileInfo = CodeGenerator.splitFiles(script)

    // generate the files
    this.#generateFiles(fileInfo)
  }

  #generateFiles(fileInfo) {
    const logEntries = []
    let failureCount = 0
    let successCount = 0
    fileInfo.forEach((fi) => {
      try {
        if (fi.content.trim().length === 0) {
          throw new Error('File has no contents.')
        }
        // save the file
        const fileAsset = new Asset(fi.path, this.targetFolderPath)
        fileAsset.writeFile(fi.content)
        successCount++
        logEntries.push({
          timestamp: new Date().toISOString(),
          result: 'success',
          path: fi.path,
          message: `Successfully generated file.`,
        })
      } catch (e) {
        failureCount++
        logEntries.push({
          timestamp: new Date().toISOString(),
          result: 'failure',
          path: fi.path,
          message: e.message,
        })
      }
    })

    // write a log file
    const logAsset = new Asset('_generator.log', this.targetFolderPath)
    if (logEntries.length > 0) {
      logAsset.writeLine(`${successCount} files succeeded.`)
      logAsset.writeLine(`${failureCount} files failed.\n`)
      logEntries.forEach((entry) => {
        logAsset.writeLine(`\n${entry.timestamp} - [${entry.path}]`)
        logAsset.writeLine(`${entry.result} - ${entry.message}`)
      })
    }
    logAsset.saveFile()

    // return the summary
    return {success: successCount, failure: failureCount}
  }

  static splitFiles(script) {
    const fileInfo = [] // empty array for results
    // iterate through matches
    let match
    while ((match = CodeGenerator.FileSplitRegex.exec(script))) {
      fileInfo.push({
        path: match.groups?.path,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      })
    }

    // derive content
    fileInfo.forEach((fi, index, fis) => {
      const startSplice = fi.endIndex + 1
      const endSplice = index === fis.length - 1 ? script.length : fis[index + 1].startIndex
      fi.content = script.substring(startSplice, endSplice).trim()
    })

    return fileInfo
  }
}
