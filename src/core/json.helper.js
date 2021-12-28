import {JSONPath} from 'jsonpath-plus'

/**
 * Return a reference from an array of references based on an `id` value.
 * @param {Array<JSON>} references Array of objects minimally have a structure of {id}.
 * @param {*} id Identifier to be matched in the retrieval.
 * @returns Returns the first matching reference.
 */
const getReferenceById = (references, id) => {
  return references.find((r) => r.id === id)
}

/**
 * Returns objects corresponding the the Json Path.
 * @param {JSON} json Json object to search.
 * @param {String} jsonPath Json Path query statement.
 * @returns {Array<JSON>} Array of Json objects returned from the Json Path query.
 */
const getObjects = (json, jsonPath) => {
  return JSONPath({json, path: jsonPath, wrap: true})
}

/**
 * Returns objects where the "tag" values match the regex pattern.
 * @param {JSON} json Json object to search.
 * @param {Array<JSON>} filters Array of filters having the structure {key, value, target}.
 * @returns {Array<JSON>} Array of Json objects matching the filter criteria.
 */
const getObjectsByFilter = (json, filters) => {
  const jsonPath = `$..*${buildFilterPhrase(filters)}`
  return getObjects(json, jsonPath)
}

/**
 * Returns objects where the "tag" values match the regex pattern.
 * @param {JSON} json Json object to search.
 * @param {RegExp | String} tagRegex Regex or string pattern whose test against the key value will be true to return results.
 * @returns {Array<JSON>} Array of Json objects matching the filter criteria.
 */
const getObjectsByTag = (json, tagValues) => {
  const filters = [{key: 'tags', values: tagValues, target: 'array'}]
  const jsonPath = `$..*${buildFilterPhrase(filters)}`
  return getObjects(json, jsonPath)
}

/**
 * Returns objects where the "id" key matches the specified parameter.
 * @param {JSON} json Json object to search.
 * @param {String} id Value of the "id" key to search.
 * @param {Boolean} single Optional, default true. Indicates whether to return a single value rather than an array.
 * @returns {JSON | Array<JSON>} Single Json or array of Json objects matching the filter criteria.
 */
const getObjectsById = (json, id, single = true) => {
  const filters = [{key: 'id', value: id}]
  const jsonPath = `$..*${buildFilterPhrase(filters)}`
  const results = getObjects(json, jsonPath)
  return single ? results[0] : results
}

/**
 * Returns a Json Path filtering phrase that can be appended to a global path.
 * @param {Array<JSON>} filters Array of filters having the structure {key, value, target}.
 * @returns {String} Single phrase text in Json Path format.
 */
const buildFilterPhrase = (filters) => {
  if (!filters) return null
  if (!Array.isArray(filters)) filters = [filters]

  const phrases = []
  filters.forEach((filter) => {
    const {key, value, values, target} = filter
    const word = getFilterWord(key, values ?? value, target)
    if (word) phrases.push(word)
  })

  if (phrases.length == 0) {
    return null
  } else {
    return `[?(@ && ${phrases.join(' && ')})]`
  }

  /**
   * Returns a Json Path comparison.
   * @param {String} key Name of the key to evaluate.
   * @param {Array<any>} values Array of values use for OR comparison with the key value.
   * @param {String} target Optional. Type of data contained in the key value (only "array" is recognized).
   * @returns {String} Single comparison text in Json Path format.
   */
  function getFilterWord(key, values, target) {
    if (!Array.isArray(values)) values = [values] // put value into array
    // setup the evaluation key
    let evalKey = target === 'array' ? 'x' : `@.${key}`

    // build the comparisons
    const comparisons = []
    values.forEach((value) => {
      if (value instanceof RegExp) {
        comparisons.push(`/${value.source}/${value.flags}.test(${evalKey})`)
      } else if (typeof value === 'string') {
        comparisons.push(`${evalKey}=='${value}'`)
      } else if (typeof value === 'boolean') {
        comparisons.push(`${evalKey}==${value ? 'true' : 'false'}`)
      } else if (typeof value === 'number') {
        comparisons.push(`${evalKey}==${value.toString()}`)
      }
    })

    // build the phrase
    if (comparisons.length === 0) return undefined
    if (target === 'array') {
      return `@ && @.${key}?.find(x => (${comparisons.join(' || ')}))`
    } else {
      return `${comparisons.join(' || ')}`
    }
  }
}

export default {
  getReferenceById,
  getObjects,
  getObjectsByFilter,
  getObjectsByTag,
  getObjectsById,
  buildFilterPhrase,
}
