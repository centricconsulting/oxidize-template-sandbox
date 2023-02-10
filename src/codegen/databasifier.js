import codifier from './codifier.js'
import jsonHelper from './json.helper.js'
import DatabaseOptions from './databasifier-presets.js'

function getDataType(attributeClass, databaseOptions) {
  const dtm = databaseOptions.dataTypeMap
  let dtItem = dtm.find((m) => m.nominal === attributeClass?.scalar)
  if (dtItem && dtItem.target) return dtItem.target(attributeClass)
  return dtm.defaultDataType ?? 'Unknown'
}

function multiplicityRequired(multiplicityId) {
  return ['EXACTLY_ONE', 'ONE_TO_MANY'].includes(multiplicityId)
}

function multiplicityInferTable(multiplicityId) {
  return ['ONE_TO_MANY', 'ZERO_TO_MANY'].includes(multiplicityId)
}

function multiplicitySingleValue(multiplicityId) {
  return ['EXACTLY_ONE', 'ZERO_TO_ONE'].includes(multiplicityId)
}

/**
 * Returns a text value modified to confirm to descriptor rules in an attribute class.
 * @param {string} text Text value to which to apply the descriptor logic in the attribute class.
 * @param {*} attributeClass Attribute class object containing descriptor rules.
 */
const enforceDescriptors = (text, attributeClass) => {
  // simple case: text already ends with descriptor
  if (!attributeClass || !attributeClass.descriptor) return text
  if (!text) return ''

  if (text.toUpperCase().endsWith(attributeClass.descriptor?.toUpperCase())) {
    return text
  }

  // create a working set of variations
  let variations = [attributeClass.name]
  if (attributeClass.variations && attributeClass.variations.length > 0) {
    variations = variations.concat(attributeClass.variations)
  }

  // iterate through all variations
  for (let v = 0; v < variations.length; v++) {
    const variation = variations[v]
    // if the text ends in the variation replace with the descriptor
    if (text.toUpperCase().endsWith(variation?.toUpperCase())) {
      return text.slice(0, text.length - variation.length).concat(attributeClass.descriptor)
    }
  }

  return text.concat(' ', attributeClass.descriptor)
}

/**
 * Returns the text prefixed with the context.
 * @param {string} text Text value to be enforced.
 * @param {string} context Context related the text value.
 */
const enforceReturnContext = (text, context) => {
  let result = text ?? ''
  if (!context?.length > 0) return result

  if (!result?.toUpperCase().startsWith(context.toUpperCase())) {
    if (result.length === 0) {
      result = context
    } else {
      result = context?.concat(' ', result)
    }
  }
  return result
}

/**
 * Returns the text prefixed with the context.
 * @param {string} text Text value to be enforced.
 * @param {string} context Context related the text value.
 */
const enforceReturnEntity = (text, entityName) => {
  let result = text ?? ''
  if (!entityName?.length > 0) return result

  if (!result?.toUpperCase().endsWith(entityName.toUpperCase())) {
    if (result.length === 0) {
      result = entityName
    } else {
      result = result.concat(' ', entityName)
    }
  }
  return result
}

/**
 *
 * @param {JSON} json JSON containing nested project metadata.
 * @param {JSON} codifyOptions JSON containing codify options
 * @param {JSON} databaseOptions JSON containing databaseify options
 * @returns
 */
const getDatabaseJson = (json, codifyOptions, databaseOptions) => {
  // SUPPORT FUNCTION
  const prepareAttributeName = (attribute, attributeClass) => {
    // default attribute name
    let defaultName = attribute.name
    // enforce descriptors if valid
    if (databaseOptions?.enforceDescriptors === true) {
      defaultName = enforceDescriptors(defaultName, attributeClass)
    }
    // apply database prepare options
    if (databaseOptions?.attributeName?.prepare) {
      defaultName = databaseOptions.attributeName.prepare(defaultName, attribute, attributeClass)
    }
    return defaultName
  }

  // SUPPORT FUNCTION
  const prepareForeignAttributeName = (attribute, foreignEntity) => {
    let defaultName = attribute.name
    // enforce context if valid
    if (databaseOptions?.enforceReturnContext && attribute?.return?.context?.length > 0) {
      defaultName = enforceReturnContext(defaultName, attribute.return.context)
    }
    // enforce context if valid
    if (databaseOptions?.enforceReturnEntity && foreignEntity) {
      defaultName = enforceReturnEntity(defaultName, foreignEntity)
    }
    // apply other prepare logic
    if (databaseOptions?.foreignAttributeName?.prepare) {
      defaultName = databaseOptions.foreignAttributeName.prepare(defaultName, attribute, foreignEntity)
    }

    return defaultName
  }

  // SUPPORT FUNCTION
  const prepareEntityName = (entity) => {
    let defaultName = entity.name
    // apply other prepare logic
    if (databaseOptions?.entityName?.prepare) {
      defaultName = databaseOptions.entityName.prepare(defaultName, entity)
    }
    return defaultName
  }

  // codify everything first
  // codifier.codifyJson(json, codifyOptions)

  // iterate through entities (these will be tables)
  const dbJson = {tables: []}
  json.entities.forEach((entity) => {
    const foreignKeys = []

    // determine the entity name
    const entityName = prepareEntityName(entity)

    const table = {
      ...entity.tagProperties,
      ...entity.customFieldProperties,
      type: 'table',
      id: entity.id,
      name: codifier.codifyText(entityName, codifyOptions),
      entityName,
      columns: [],
    }

    // iterate through attributes (these will be columns)
    entity.attributes.forEach((attribute, attributeIndex) => {
      // find the attribute class
      let attributeName, columnName
      const attributeClass = json.attributeClasses.find((x) => x.id === attribute.return?.attributeClassId)

      // determine if a foreign key is warranted
      // AC specifies a reference and the entityId has a value

      const isForeignKey =
        attribute?.return?.reference === true && multiplicitySingleValue(attribute?.multiplicityId)
      let foreignEntity
      if (isForeignKey) {
        foreignEntity = json.entities.find((x) => x.id === attribute?.return?.entityId)
      }

      // generate a foreign key if FK
      if (isForeignKey && foreignEntity) {
        // find the target entity
        const foreignEntityName = prepareEntityName(foreignEntity) ?? 'Unknown'
        attributeName = prepareForeignAttributeName(attribute, foreignEntity)

        foreignKeys.push({
          referenceColumnId: attribute.id,
          referenceColumnName: columnName,
          foreignTableId: foreignEntity.id,
          foreignTableName: codifier.codifyText(foreignEntityName, codifyOptions),
        })
      } else {
        attributeName = prepareAttributeName(attribute, attributeClass)
      }

      columnName = codifier.codifyText(attributeName, codifyOptions)

      const column = {
        ...attribute.tagProperties,
        ...attribute.customFieldProperties,
        type: 'column',
        id: attribute.id,
        tableId: entity.id,
        index: attributeIndex + 1,
        name: columnName,
        attributeName: attribute.name,
        grain: attribute.grain,
        dataType:
          attribute.return?.reference === true
            ? databaseOptions?.keyDataType
            : getDataType(attributeClass, databaseOptions) ?? databaseOptions.defaultDataType,

        required: multiplicityRequired(attribute.multiplicityId),
      }

      table.columns.push(column)
    }) // END attributes

    if (foreignKeys.length > 0) {
      table.foreignKeys = foreignKeys
    }

    dbJson.tables.push(table)
  }) // END entities

  return dbJson
}

export default {
  ...DatabaseOptions,
  getDatabaseJson,
  enforceReturnContext,
  enforceDescriptors,
  getDataType,
  multiplicityRequired,
  multiplicitySingleValue,
  multiplicityInferTable,
}
