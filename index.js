import fs from 'fs'
import CodeGenerator from './src/codegen/code.generator.js'
import Asset from './src/codegen/asset.js'
import jsonHelper from './src/codegen/json.helper.js'
import codifier from './src/codegen/codifier.js'
import databasifier from './src/codegen/databasifier.js'
import beautify from 'json-beautify'

main()
/**
 * Initiation point for the application.
 */
function main() {
  // ######  load files ######
  // specificy the folder path
  const targetFolderPath = './output'
  // load the script text
  const templateScript = fs.readFileSync('./input/template.edw_table_create.ejs', 'utf8')
  // convert the payload to parsed json
  const payload = fs.readFileSync('./input/metadata.json', 'utf8')
  // load the json text
  const payloadJson = JSON.parse(payload)

  // ###### demonstrate JsonHelper ######
  // demoJsonHelper(payloadJson)

  // ###### demonstrate Databasifier ######
  demoDatabasifier(payloadJson)

  // ###### demonstrate Codifier ######
  // demoCodifier()

  // ######  execute code generation ######
  const codeGenerator = new CodeGenerator(payloadJson, templateScript, targetFolderPath)
  codeGenerator.generate()
  codeGenerator.writeFiles()
  codeGenerator.writeZip('template_EDW_TransientTables.zip')
}

/**
 * Demonstrates the use of jsonHelper functions.
 * @param {*} json Json object used for the demo.
 */
function demoDatabasifier(json) {
  const codifyOptions = codifier.DatabaseCodifyOptions
  const databaseOptions = databasifier.SqlServerDatabaseOptions
  const dbJson = databasifier.getDatabaseJson(json.project, codifyOptions, databaseOptions)
  fs.writeFileSync('output/databasify.json', beautify(dbJson))
}

/**
 * Demonstrates the use of codify functions.
 * @param {*} json Json object used for the demo.
 */
function demoCodifier() {
  let codifyOptions
  const sourceKey = 'name'
  const targetKey = '__code'
  const json = {
    name: 'Insurance analytics# platform',
  }

  console.log('\ncodifier - DEMO #1')
  codifyOptions = codifier.DatabaseCodifyOptions
  codifier.codifyJson(json, codifyOptions, sourceKey, targetKey)
  console.log(
    'DatabaseCodifyOptions - PRE-BUILT DATABASE OPTIONS\n',
    `name: ${json.name}\n`,
    `__code: ${json.__code}\n`
  )

  console.log('\ncodifier - DEMO #2')
  codifyOptions = codifier.JavascriptCodifyOptions
  codifier.codifyJson(json, codifyOptions, sourceKey, targetKey)
  console.log(
    'JavascriptCodifyOptions - PRE-BUILT JAVASCRIPT OPTIONS\n',
    `name: ${json.name}\n`,
    `__code: ${json.__code}\n`
  )

  console.log('\ncodifier - DEMO #3')
  codifyOptions = {
    case: codifier.CaseOptionEnum.Proper,
    preserveCaps: true,
    substitutions: [
      {find: /\s+/gim, replace: '_'}, // remove all whitespace
      {find: /\W+/gim, replace: '0'}, // replace non-words with hyphen
    ],
  }
  codifier.codifyJson(json, codifyOptions, sourceKey, targetKey)
  console.log('Custom - CUSTOM\n', `name: ${json.name}\n`, `__code: ${json.__code}\n`)
}

/**
 * Demonstrates the use of jsonHelper functions.
 * @param {*} json Json object used for the demo.
 */
function demoJsonHelper(json) {
  let result, jsonPath, filters

  console.log('\njsonHelper - DEMO #1')
  jsonPath = `$..*[?(@ && @.type=='attribute' && /Account/gmi.test(@.name))]`
  result = jsonHelper.getObjects(json.project, jsonPath)
  console.log('getObjects - MULTIPLE CONDITIONS ...first item\n', result[0])

  console.log('\njsonHelper - DEMO #2')
  filters = [
    {key: 'name', value: /Account/gim},
    {key: 'type', value: 'attribute'},
  ]
  result = jsonHelper.getObjectsByFilter(json, filters)
  console.log('getObjectsByFilter - MULTIPLE CONDITIONS ...first item\n', result[0])

  console.log('\njsonHelper - DEMO #3')
  filters = [
    {key: 'tags', value: [/tag4/gim, 'tag3'], target: 'array'},
    {key: 'type', value: 'attribute'},
  ]
  result = jsonHelper.getObjectsByFilter(json, filters)
  console.log('getObjectsByFilter - TARGET ARRAY ...first item\n', result[0])

  console.log('\njsonHelper - DEMO #4')
  const id = '8e6fbe7d-98f3-42d1-8a17-eb8b441faf39'
  result = jsonHelper.getObjectsById(json, id, false)
  console.log('getObjectsById - SINGLE ID ...first item\n', result[0])

  console.log('\njsonHelper - DEMO #5')
  const tagValues = [/tag4/gim, /Some/gim]
  result = jsonHelper.getObjectsByTag(json, tagValues)
  console.log('getObjectsById - SINGLE ID ...first item\n', result[0])
}
