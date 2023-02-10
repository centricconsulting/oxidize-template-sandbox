import jsonHelper from './json.helper.js'
import CodifyOptions from './codifier-presets.js'

/**
 * Codifies a text value based on the Codify Options provided.
 * @param {String} text Text value to Codify.
 * @param {JSON} codifyOptions Complete set of Codify Options.
 * @returns Codified version of the original text value.
 */
const codifyText = (text, codifyOptions) => {
  if (!codifyOptions) return text
  if (!text) return undefined

  // handle simple case options first
  if (codifyOptions.case === CodifyOptions.CaseOptionEnum.Upper) {
    text = text.toUpperCase()
  } else if (codifyOptions.case === CodifyOptions.CaseOptionEnum.Lower) {
    text = text.toLowerCase()
  } else {
    // break text into array
    const initialText = text
    const textArray = text.split('')
    // iterate through each character
    for (let t = 0; t < textArray.length; t++) {
      const currentCapsFlag = /[A-Z]/.test(initialText[t])
      const priorNonCharFlag = t === 0 ? true : /\W/.test(initialText[t - 1])

      switch (codifyOptions.case) {
        case CodifyOptions.CaseOptionEnum.Proper:
          if (priorNonCharFlag || (codifyOptions.perserveCaps && currentCapsFlag)) {
            textArray[t] = textArray[t].toUpperCase()
          } else {
            textArray[t] = textArray[t].toLowerCase()
          }
          break

        case CodifyOptions.CaseOptionEnum.Camel:
          if (t === 0) {
            textArray[t] = textArray[t].toLowerCase()
          } else if (priorNonCharFlag || (codifyOptions.perserveCaps && currentCapsFlag)) {
            textArray[t] = textArray[t].toUpperCase()
          } else {
            textArray[t] = textArray[t].toLowerCase()
          }
          break
      }
    }

    text = textArray.join('')
  }

  // apply substitutions
  if (codifyOptions.substitutions?.length > 0) {
    codifyOptions.substitutions.forEach((sub) => {
      text = text.replace(sub.find, sub.replace)
    })
  }

  if (typeof codifyOptions.escape === 'function') {
    return codifyOptions.escape(text)
  } else {
    return text
  }
}

/**
 * Codifies the value of all nested Json source keys.
 * @param {*} json Json object to codify.  This object is codified in place `by reference`.
 * @param {*} codifyOptions Complete set of Codify Options.
 * @param {*} sourceKey Name of the key whose text will be codified.
 * @param {*} targetKey Name of the key to which the codified text will be assigned.
 */
const codifyJson = (json, codifyOptions, sourceKey, targetKey) => {
  if (!sourceKey) sourceKey = 'name'
  if (!targetKey) targetKey = '__code'
  codifyObject(json)

  function codifyObject(obj) {
    if (!obj) return obj
    if (Array.isArray(obj) && obj.length > 0) {
      // recurse on each array element
      obj.forEach((element) => {
        codifyObject(element)
      })
    } else if (typeof obj === 'object') {
      // iterate through keys of the object
      Object.keys(obj).forEach((key) => {
        const element = obj[key]
        if (key === sourceKey) {
          const elementType = typeof element
          if (elementType === 'object') {
            // recures on each element of the object
            codifyObject(element)
          } else if (elementType === 'string') {
            obj[targetKey] = codifyText(obj[sourceKey], codifyOptions)
          }
        } else {
          codifyObject(element)
        }
      })
    }
  }
}

export default {
  ...CodifyOptions,
  codifyJson,
  codifyText,
}
