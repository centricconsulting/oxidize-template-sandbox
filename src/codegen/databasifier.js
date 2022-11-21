import codifier from './codifier.js'
import jsonHelper from './json.helper.js'

const SqlServerDatabaseOptions = {
  enforceDescriptors: true, // enforces attribute class descriptors
  enforceReturnContext: true,
  enforceReturnEntity: true,
  attributeName: {
    prepare: (defaultName, attribute, attributeClass) => {
      return defaultName
    },
  },
  entityName: {
    prepare: (defaultName, entity) => {
      let entityName = defaultName
      if (entity.tagProperties?.domain) {
        return entity.tagProperties?.domain.concat(' ', entityName)
      } else {
        return entityName
      }
    },
  },
  foreignAttributeName: {
    prepare: (defaultName, attribute, foreignEntity) => {
      let attributeName = defaultName
      return attributeName.concat(' FK')
    },
  },
  defaultDataType: 'VARCHAR(200)',
  keyDataType: 'VARCHAR(200)',
  dataTypeMap: [
    {
      nominal: 'text',
      target: (attributeClass) => `VARCHAR(${attributeClass.precision ?? 200})`,
    },
    {nominal: 'character', target: () => `CHAR`},
    {nominal: 'boolean', target: () => `BIT`},
    {nominal: 'bit', target: () => `BIT`},
    {
      nominal: 'integer',
      target: (attributeClass) => {
        // precision corresponds to number of Integer bytes.
        if (!attributeClass.precision) return 'INT'
        if (attributeClass.precision <= 0) return 'BIT'
        if (attributeClass.precision <= 1) return 'TINYINT'
        if (attributeClass.precision <= 2) return 'SMALLINT'
        if (attributeClass.precision <= 4) return 'INT'
        return 'BIGINT'
      },
    },
    {
      nominal: 'decimal',
      target: (attributeClass) => {
        if (attributeClass.name.toLowerCase() === 'currency') {
          return 'MONEY'
        } else {
          return `DECIMAL(${attributeClass?.precision ?? 20},${attributeClass?.scale ?? 8})`
        }
      },
    },
    {nominal: 'identifier', target: () => 'VARCHAR(200)'},
    {
      nominal: 'float',
      target: (attributeClass) => `FLOAT(${attributeClass?.precision ?? 20},${attributeClass?.scale ?? 8})`,
    },
    {nominal: 'date', target: () => `DATE`},
    {nominal: 'time', target: () => `DATETIME2(7)`},
    {nominal: 'timestamp', target: () => `DATETIME2(7)`},
    {
      default: true,
      target: (attributeClass) => `VARCHAR(${attributeClass?.precision ?? 200})`,
    },
  ],
}

const AdfOptions = {
  primaryKeyDescriptor: 'PK',
  naturalKeyDescriptor: 'NK',
  foreignKeyDescriptor: 'FK',
  defaultDataType: 'VARCHAR(200)',
  dataTypeMap: [
    {nominal: 'text', target: () => `String`},
    {nominal: 'character', target: () => `String`},
    {nominal: 'boolean', target: () => `Boolean`},
    {nominal: 'bit', target: () => `BIT`},
    {
      nominal: 'integer',
      target: () => {
        return 'INT'
      },
    },
    {
      nominal: 'decimal',
      target: () => 'DECIMAL',
    },
    {nominal: 'identifier', target: () => 'String'},
    {nominal: 'float', target: () => `DECIMAL`},
    {nominal: 'date', target: () => `DateTime`},
    {nominal: 'time', target: () => `DateTime`},
    {nominal: 'timestamp', target: () => `DateTime`},
    {default: true, target: () => 'String'},
  ],
}

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
  if (!attributeClass) return text
  if (text.toUpperCase().endsWith(attributeClass.descriptor.toUpperCase())) {
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
    if (text.toUpperCase().endsWith(variation.toUpperCase())) {
      return text.slice(0, text.length - variation.length).concat(attributeClass.descriptor)
    }
  }

  // append the descriptor and return
  return text.concat(' ', attributeClass.descriptor)
}

/**
 * Returns the text prefixed with the context.
 * @param {string} text Text value to be enforced.
 * @param {string} context Context related the text value.
 */
const enforceReturnContext = (text, context) => {
  if (context && !text.toUpperCase().startsWith(context.toUpperCase())) {
    return context.concat(' ', text)
  } else {
    return text
  }
}

/**
 * Returns the text prefixed with the context.
 * @param {string} text Text value to be enforced.
 * @param {string} context Context related the text value.
 */
const enforceReturnEntity = (text, entity) => {
  if (entity && !text.toUpperCase().endsWith(entity.name.toUpperCase())) {
    return text.concat(' ', entity.name)
  } else {
    return text
  }
}

/**
 *
 * @param {JSON} json JSON containing nested project metadata.
 * @param {JSON} codifyOptions JSON containing codify options
 * @param {JSON} databaseOptions JSON containing databaseify options
 * @param {Array<String>} tagPrefixes Array of tag prefixes to promote to properites.
 * @returns
 */
const getDatabaseJson = (json, codifyOptions, databaseOptions) => {
  // SUPPORT FUNCTION
  const prepareAttributeName = (attribute, attributeClass, flags) => {
    let attributeName = attribute.name
    // enforce descriptors if valid
    if (databaseOptions.enforceDescriptors) {
      attributeName = enforceDescriptors(attributeName, attributeClass)
    }
    // apply database prepare options
    if (databaseOptions?.attributeName?.prepare) {
      attributeName =
        databaseOptions?.attributeName?.prepare(attributeName, attribute, attributeClass) ?? attributeName
    }
    return attributeName
  }

  // SUPPORT FUNCTION
  const prepareForeignAttributeName = (attribute, foreignEntity) => {
    let foreignAttributeName = attribute.name
    // enforce context if valid
    if (databaseOptions.enforceReturnContext && attribute?.return?.context?.length > 0) {
      foreignAttributeName = enforceReturnContext(foreignAttributeName, attribute.return.context)
    }
    // enforce context if valid
    if (databaseOptions.enforceReturnEntity && foreignEntity) {
      foreignAttributeName = enforceReturnEntity(foreignAttributeName, foreignEntity)
    }
    // apply other prepare logic
    if (databaseOptions?.foreignAttributeName?.prepare) {
      foreignAttributeName = databaseOptions.foreignAttributeName.prepare(
        foreignAttributeName,
        attribute,
        foreignEntity
      )
    }

    return foreignAttributeName
  }

  // SUPPORT FUNCTION
  const prepareEntityName = (entity) => {
    let entityName = entity.name
    // apply other prepare logic
    if (databaseOptions?.entityName?.prepare) {
      entityName = databaseOptions?.entityName?.prepare(entityName, entity) ?? entityName
    }
    return entityName
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
      type: 'table',
      id: entity.id,
      name: codifier.codifyText(entityName, codifyOptions),
      entityName: entity.name,
      columns: [],
    }

    // iterate through attributes (these will be columns)
    entity.attributes.forEach((attribute, attributeIndex) => {
      // find the attribute class
      let attributeName,
        columnName,
        flags = {}

      const attributeClass = json.attributeClasses.find((x) => x.id === attribute.return?.attributeClassId)

      // determine if a foreign key is warranted
      // AC specifies a reference and the entityId has a value
      flags.isForeignKey =
        attribute?.return?.reference === true && multiplicitySingleValue(attribute?.multiplicityId)

      // generate a foreign key if FK
      if (flags.isForeignKey) {
        // find the target entity
        const foreignEntity = json.entities.find((x) => x.id === attribute?.return?.entityId)
        const foreignEntityName = prepareEntityName(foreignEntity) ?? 'Unknown'

        // construct the target entity name with context
        attributeName = prepareForeignAttributeName(attribute, foreignEntity)
        columnName = codifier.codifyText(attributeName, codifyOptions)

        foreignKeys.push({
          referenceColumnId: attribute.id,
          referenceColumnName: columnName,
          foreignTableId: foreignEntity.id,
          foreignTableName: codifier.codifyText(foreignEntityName, codifyOptions),
        })
      } else {
        attributeName = prepareAttributeName(attribute, attributeClass)
        columnName = codifier.codifyText(attributeName, codifyOptions)
      }

      const column = {
        ...attribute.tagProperties,
        type: 'column',
        id: attribute.id,
        tableId: entity.id,
        index: attributeIndex + 1,
        name: columnName,
        attributeName: attribute.name,
        grain: attribute.grain,
        dataType:
          attribute.return?.reference === true
            ? databaseOptions.keyDataType
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
  getDatabaseJson,
  SqlServerDatabaseOptions,
  AdfOptions,
  enforceReturnContext,
  enforceDescriptors,
  getDataType,
  multiplicityRequired,
  multiplicitySingleValue,
  multiplicityInferTable,
}
