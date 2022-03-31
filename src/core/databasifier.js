import codifier from './codifier.js'
import jsonHelper from './json.helper.js'

const SqlServerDatabaseOptions = {
  primaryKeyDescriptor: 'PK',
  naturalKeyDescriptor: 'NK',
  foreignKeyDescriptor: 'FK',
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
    {
      nominal: 'decimal',
      target: (precision, scale) => `DECIMAL(${precision ?? 20},${scale ?? 8})`,
    },
    {nominal: 'identifier', target: () => 'VARCHAR(200)'},
    {
      nominal: 'float',
      target: (precision, scale) => `FLOAT(${precision ?? 20},${scale ?? 8})`,
    },
    {nominal: 'date', target: () => `DATE`},
    {nominal: 'time', target: () => `DATETIME2(7)`},
    {nominal: 'timestamp', target: () => `DATETIME2(7)`},
    {default: true, target: () => 'VARCHAR(200)'},
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
    {nominal: 'decimal', target: () => `DECIMAL`},
    {nominal: 'identifier', target: () => 'String'},
    {nominal: 'float', target: () => `DECIMAL`},
    {nominal: 'date', target: () => `DateTime`},
    {nominal: 'time', target: () => `DateTime`},
    {nominal: 'timestamp', target: () => `DateTime`},
    {default: true, target: () => 'String'},
  ],
}

function getDataType({scalar, precision, scale}, databaseOptions) {
  const dtm = databaseOptions.dataTypeMap
  let dtItem = dtm.find((m) => m.nominal === scalar)
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
const getDatabaseJson = (json, codifyOptions, databaseOptions) => {
  // codify everything first
  codifier.codifyJson(json, codifyOptions)

  // iterate through entities (these will be tables)
  const dbJson = {tables: []}
  json.entities.forEach((entity) => {
    const foreignKeys = []
    // populate entity info
    const table = {
      ...entity.tagProperties,
      type: 'table',
      id: entity.id,
      name: codifier.codifyText(entity.name, codifyOptions),
      originalName: entity.name,
      columns: [],
    }

    // iterate through attributes (these will be columns)
    entity.attributes.forEach((attribute, attributeIndex) => {
      // find the attribute class
      let attributeName, columnName
      const ac = json.attributeClasses.find((x) => x.id === attribute.return?.attributeClassId)

      // determine if a foreign key is warranted
      // AC specifies a reference and the entityId has a value
      const generatesFK =
        attribute?.return?.reference === true && multiplicitySingleValue(attribute?.multiplicityId)

      // generate a foreign key if FK
      if (generatesFK) {
        // find the target entity
        const targetEntity = json.entities.find((x) => x.id === attribute?.return?.entityId)
        const targetEntityName = targetEntity?.name ?? 'Unknown'

        // construct the target entity name with context
        attributeName = attribute.return?.context
          ? attribute.return.context.concat(' ', targetEntityName)
          : targetEntityName

        columnName = codifier.codifyText(
          attributeName.concat(' ', databaseOptions.foreignKeyDescriptor),
          codifyOptions
        )

        foreignKeys.push({
          foreignColumnName: codifier.codifyText(
            attributeName.concat(' ', databaseOptions.foreignKeyDescriptor),
            codifyOptions
          ),
          referenceTableName: codifier.codifyText(targetEntityName, codifyOptions),
          referenceColumnName: codifier.codifyText(
            targetEntityName.concat(' ', databaseOptions.primaryKeyDescriptor),
            codifyOptions
          ),
          referenceTableId: targetEntity?.id,
        })
      } else {
        attributeName = attribute.name
        columnName = codifier.codifyText(attributeName, codifyOptions)
      }

      const column = {
        ...attribute.tagProperties,
        type: 'column',
        id: attribute.id,
        tableId: entity.id,
        index: attributeIndex + 1,
        name: columnName,
        originalName: attributeName,
        grain: attribute.grain,
        dataType:
          attribute.return?.reference === true
            ? getDataType({type: 'identifier'}, databaseOptions)
            : getDataType(
                {
                  type: ac?.scalar,
                  precision: ac?.precision,
                  scale: ac?.scale,
                },
                databaseOptions
              ) ?? databaseOptions.defaultDataType,

        required: multiplicityRequired(attribute.multiplicityId),
        tagProperties: attribute.tagProperties,
      }

      table.columns.push(column)
    }) // END attributes

    table.foreignKeys = foreignKeys
    dbJson.tables.push(table)
  }) // END entities

  return dbJson
}

export default {getDatabaseJson, SqlServerDatabaseOptions, AdfOptions}
