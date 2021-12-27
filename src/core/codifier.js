/**
 * Cases used to specify Codify Options.
 */
const CaseOptionEnum = {
  Upper: 'upper',
  Lower: 'lower',
  Proper: 'proper',
  Camel: 'camel',
}

/**
 * Complete set of Codify Options for databases.
 */
const DatabaseCodifyOptions = {
  case: CaseOptionEnum.Upper,
  substitutions: [
    {find: /(\s+|\W)+/gim, replace: '_'}, // replace whitespace with underscore
  ],
  wrapper: {left: '[', right: ']'},
}

/**
 * Complete set of Codify Options for Javascript.
 */
const JavascriptCodifyOptions = {
  case: CaseOptionEnum.Camel,
  preserveCaps: true,
  substitutions: [
    {find: /\s+/gim, replace: ''}, // remove all whitespace
    {find: /\W+/gim, replace: '-'}, // replace non-words with hyphen
  ],
}

/**
 * Codifies a text value based on the Codify Options provided.
 * @param {String} text Text value to Codify.
 * @param {JSON} codifyOptions Complete set of Codify Options.
 * @returns Codified version of the original text value.
 */
const codifyText = (text, codifyOptions) => {
  if (!codifyOptions) return text
  if (!text) return undefined

  // trim and replace whitespace with single character
  text = text.trim().replace(/\s+/g, ' ')

  // handle simple case options first
  if (codifyOptions.case === CaseOptionEnum.Upper) {
    text = text.toUpperCase()
  } else if (codifyOptions.case === CaseOptionEnum.Lower) {
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
        case CaseOptionEnum.Proper:
          if (priorNonCharFlag || (codifyOptions.perserveCaps && currentCapsFlag)) {
            textArray[t] = textArray[t].toUpperCase()
          } else {
            textArray[t] = textArray[t].toLowerCase()
          }
          break

        case CaseOptionEnum.Camel:
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

  // wrappers
  if (codifyOptions.wrapper?.left?.length > 0) {
    text = codifyOptions.wrapper.left.concat(text)
  }

  if (codifyOptions.wrapper?.right?.length > 0) {
    text = text.concat(codifyOptions.wrapper.right)
  }

  return text
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

export default {codifyJson, codifyText, CaseOptionEnum, DatabaseCodifyOptions, JavascriptCodifyOptions}
