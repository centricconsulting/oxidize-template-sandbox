import codifier from './codifier.js'
import jsonHelper from './json.helper.js'

const SqlServerDatabaseOptions = {
  columnKeySegment: 'ID',
  defaultDataType: 'VARCHAR(200)',
  dataTypeMap: [
    {nominal: 'text', target: (precision) => `VARCHAR(${precision ?? 200})`},
    {nominal: 'character', target: () => `CHAR`},
    {nominal: 'boolean', target: () => `BIT`},
    {nominal: 'bit', target: () => `BIT`},
    {
      nominal: 'integer',
      target: (precision) => {
        // precision corresponds to number of Integer bytes.
        if (!precision) return 'INT'
        if (precision <= 0) return 'BIT'
        if (precision <= 1) return 'TINYINT'
        if (precision <= 2) return 'SMALLINT'
        if (precision <= 4) return 'INT'
        return 'BIGINT'
      },
    },
    {nominal: 'decimal', target: (precision, scale) => `DECIMAL(${precision ?? 20},${scale ?? 8})`},
    {nominal: 'identifier', target: () => 'VARCHAR(200)'},
    {nominal: 'float', target: (precision, scale) => `FLOAT(${precision ?? 20},${scale ?? 8})`},
    {nominal: 'date', target: () => `DATE`},
    {nominal: 'time', target: () => `DATETIME2(7)`},
    {nominal: 'timestamp', target: () => `DATETIME2(7)`},
    {default: true, target: () => 'VARCHAR(200)'},
  ],
}

const AdfOptions = {
  columnKeySegment: 'ID',
  defaultDataType: 'VARCHAR(200)',
  dataTypeMap: [
    {nominal: 'text', target: () => `String`},
    {nominal: 'character', target: () => `String`},
    {nominal: 'boolean', target: () => `Boolean`},
    {nominal: 'bit', target: () => `BIT`},
    {
      nominal: 'integer',
      target: (precision) => {
        // precision corresponds to number of Integer bytes.
        if (!precision) return 'INT'
        if (precision <= 0) return 'INT'
        if (precision <= 1) return 'INT'
        if (precision <= 2) return 'INT'
        if (precision <= 4) return 'INT'
        return 'INT'
      },
    },
    {nominal: 'decimal', target: () => `DECIMAL`},
    {nominal: 'identifier', target: () => 'String'},
    {nominal: 'float', target: () => `DECIMAL`},
    {nominal: 'date', target: () => `DateTime`},
    {nominal: 'time', target: () => `DateTime`},
    {nominal: 'timestamp', target: () => `DateTime`},
    {default: true, target: () => 'String'},
  ],
}

function getDataType({type, precision, scale}, databaseOptions) {
  const dtm = databaseOptions.dataTypeMap
  let dtItem = dtm.find((m) => m.nominal === type)
  if (dtItem) return dtItem.target(precision, scale)
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
 *
 * @param {JSON} json JSON containing nested project metadata.
 * @param {JSON} codifyOptions JSON containing codify options
 * @param {JSON} databaseOptions JSON containing databaseify options
 * @param {Array<String>} tagPrefixes Array of tag prefixes to promote to properites.
 * @returns
 */
const getDatabaseJson = (json, codifyOptions, databaseOptions, tagPrefixes) => {
  // codify everything first
  codifier.codifyJson(json, codifyOptions)

  // create regex version of tag prefixes
  const tagPrefixSearches = tagPrefixes
    ?.map((prefix) => {
      try {
        return {
          prefix: prefix,
          regex: RegExp(`^${prefix}\\s*:\\s*(?<value>.*)\\s*$`, 'gi'),
        }
      } catch {
        return undefined
      }
    })
    .filter((x) => !!x)

  const transferTagAsProperty = (fromObject, toObject) => {
    if (Array.isArray(tagPrefixSearches) && Array.isArray(fromObject.tags)) {
      tagPrefixSearches.forEach((search) => {
        fromObject.tags.forEach((tag) => {
          const matches = tag.matchAll(search.regex)
          for (const match of matches) {
            const propName = search.prefix.toLowerCase()
            const propValue = match.groups?.value
            if (propValue && !toObject[propName]) {
              toObject[propName] = propValue
            }
          }
        })
      })
    }
  }

  // iterate through entities (these will be tables)
  const dbJson = {tables: []}
  json.entities.forEach((entity) => {
    const foreignKeys = []
    // populate entity info
    const table = {
      type: 'table',
      name: codifier.codifyText(entity.name, codifyOptions),
      baseName: codifier.codifyText(entity.name, {...codifyOptions, wrapper: undefined}),
      originalName: entity.name,
      columns: [],
    }

    transferTagAsProperty(entity, table)

    // add the primary key based on entity name
    table.columns.push({
      type: 'column',
      index: 0,
      primary: true,
      name: codifier.codifyText(`${entity.name} ${databaseOptions.columnKeySegment}`, codifyOptions),
      baseName: codifier.codifyText(`${entity.name} ${databaseOptions.columnKeySegment}`, {
        ...codifyOptions,
        wrapper: undefined,
      }),
      originalName: null,
      grain: false,
      dataType: getDataType('identififer', databaseOptions),
      required: true,
    })

    // iterate through attributes (these will be columns)
    entity.attributes.forEach((attribute, attributeIndex) => {
      // find the attribute class
      const ac = json.attributeClasses.find((x) => x.id === attribute.attributeClass?.id)
      // determine if a foreign key is warranted
      // AC specifies a reference and the entityId has a value
      const generatesFK =
        ac?.reference &&
        attribute?.attributeClass?.entityId &&
        multiplicitySingleValue(attribute?.multiplicityId)
      if (generatesFK) {
        // find the target entity
        const targetEntity = json.entities.find((x) => x.id === attribute.attributeClass?.entityId)

        if (targetEntity) {
          // resolve the target table name

          const targetTableName = ac.bridge
            ? // calculate a new table name based on the bridge
              codifier.codifyText(
                `${ac.bridge?.concat(' ') ?? ''}${entity.name} ${targetEntity.name}`,
                codifyOptions
              )
            : targetEntity?.__code

          foreignKeys.push({
            sourceTableName: entity.__code,
            sourceColumnName: attribute.__code,
            targetTableName: targetTableName,
          })
        }
      }

      const revisedColumnName = (attributeName, excludeWrapper = false) => {
        const localCodifyOptions = excludeWrapper ? {...codifyOptions, wrapper: undefined} : codifyOptions

        if (ac.reference) {
          return codifier.codifyText(
            `${ac.context?.concat(' ') ?? ''}${attributeName} ${databaseOptions.columnKeySegment}`,
            localCodifyOptions
          )
        } else {
          return codifier.codifyText(attributeName, localCodifyOptions)
        }
      }

      const column = {
        type: 'column',
        index: attributeIndex + 1,
        name: revisedColumnName(attribute.name),
        baseName: revisedColumnName(attribute.name, true),
        originalName: attribute.name,
        grain: attribute.grain,
        dataType: ac.reference
          ? getDataType({type: 'identifier'}, databaseOptions)
          : getDataType(ac.scalar, databaseOptions) ?? databaseOptions.defaultDataType,

        required: multiplicityRequired(attribute.multiplicityId),
      }
      transferTagAsProperty(attribute, column)
      table.columns.push(column)
    }) // END attributes

    table.foreignKeys = foreignKeys
    dbJson.tables.push(table)
  }) // END entities

  return dbJson
}

export default {getDatabaseJson, SqlServerDatabaseOptions, AdfOptions}
