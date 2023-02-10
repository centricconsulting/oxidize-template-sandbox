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
    {find: /\s+/g, replace: ' '}, // replace whitespace with single space
    {find: /(\s+|\W)+/gim, replace: '_'}, // replace whitespace with underscore
  ],
  escapeFn: (text) => {
    return text.replace("'", "''")
  },
}

/**
 * Complete set of Codify Options for Javascript.
 */
const JavascriptCodifyOptions = {
  case: CaseOptionEnum.Camel,
  preserveCaps: true,
  substitutions: [
    {find: /\s+/gim, replace: ''}, // remove all whitespace
    {find: /\W+/gim, replace: ''}, // replace non-words with hyphen
  ],
  escapeFn: (text) => {
    return jsonHelper.escape(text)
  },
}

export default {CaseOptionEnum, DatabaseCodifyOptions, JavascriptCodifyOptions}
