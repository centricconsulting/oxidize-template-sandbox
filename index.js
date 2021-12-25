#!/usr/bin/env node
/** @format */

import Asset from './src/core/asset.js'
import CodeGenerator from './src/generator.js'
import fs from 'fs'
import jsonHelper from './src/core/json.helper.js'
import codifier from './src/core/codifier.js'

main()
/**
 * Initiation point for the application.
 */
function main() {
  // ######  load files ######
  // specificy the folder path
  const targetFolderPath = './output'
  // load the script text
  const templateScript = fs.readFileSync('./input/template.ejs', 'utf8')
  // convert the payload to parsed json
  const payload = fs.readFileSync('./input/metadata.json', 'utf8')
  // load the json text
  const payloadJson = JSON.parse(payload)

  // ######  execute code generation ######
  // const codeGenerator = new CodeGenerator(payloadJson, templateScript, targetFolderPath)
  // codeGenerator.generate()

  // ###### demonstrate JsonHelper ######
  // demoJsonHelper(payloadJson)

  // ###### demonstrate Codifier ######
  demoCodifier(payloadJson)
}

/**
 * Demonstrates the use of codify functions.
 * @param {*} json Json object used for the demo.
 */
function demoCodifier(json) {
  let codifyOptions, text
  const sourceKey = 'name'
  const targetKey = '__code'
  const originalText = 'Insurance**AnalyticsPlatform'

  // console.log('\ncodifier - DEMO #1')
  // codifyOptions = codifier.DatabaseOptions('lower')
  // codifier.codifyJson(json, codifyOptions, sourceKey, targetKey)
  // console.log(
  //   'codify - PRE-BUILT DATABASE OPTIONS ...first item\n',
  //   `name: ${json.metadata.project.name}\n`,
  //   `__code: ${json.metadata.project?.__code}\n`
  // )

  // console.log('\ncodifier - DEMO #2')
  // codifyOptions = codifier.JavascriptOptions
  // codifier.codifyJson(json, codifyOptions, sourceKey, targetKey)
  // console.log(
  //   'codify - PRE-BUILT JAVASCRIPT OPTIONS ...first item\n',
  //   `name: ${json.metadata.project.name}\n`,
  //   `__code: ${json.metadata.project?.__code}\n`
  // )

  // console.log('\ncodifier - DEMO #3')
  codifyOptions = codifier.JavascriptOptions
  // codifier.codifyJson(json, codifyOptions, sourceKey, targetKey)
  text = codifier.codifyText(originalText, codifyOptions)
  // console.log('codify - CUSTOM OPTIONS ...first item\n', `originalText: ${originalText}\n`, `codifiedText: ${text}\n`)
  console.log('result', `originalText: ${originalText}\n`, `codifiedText: ${text}\n`)
}

/**
 * Demonstrates the use of jsonHelper functions.
 * @param {*} json Json object used for the demo.
 */
function demoJsonHelper(json) {
  let result, jsonPath, filters

  console.log('\njsonHelper - DEMO #1')
  jsonPath = `$..*[?(@.type=='attribute' && /Account/gmi.test(@.name))]`
  result = jsonHelper.getObjects(json, jsonPath)
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
