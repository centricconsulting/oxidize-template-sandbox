const CaseOptionEnum = {
  Upper: 'upper',
  Lower: 'lower',
  Proper: 'proper',
  Camel: 'camel',
}

const DatabaseOptions = {
  case: CaseOptionEnum.Upper,
  substitutions: [
    {find: /(\s+|\W)+/gim, replace: '_'}, // replace whitespace with underscore
  ],
  wrapper: {left: '[', right: ']'},
}

const JavascriptOptions = {
  case: CaseOptionEnum.Camel,
  preserveCaps: true,
  substitutions: [
    {find: /\s+/gim, replace: ''}, // remove all whitespace
    {find: /\W+/gim, replace: '-'}, // replace non-words with hyphen
  ],
}

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

const codifyJson = (json, codifyOptions, sourceKey, targetKey) => {
  if (!sourceKey) sourceKey = 'name'
  if (!targetKey) targetKey = '__code'
  codifyObject(json)

  function codifyObject(obj) {
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

export default {codifyJson, codifyText, CaseOptionEnum, DatabaseOptions, JavascriptOptions}
