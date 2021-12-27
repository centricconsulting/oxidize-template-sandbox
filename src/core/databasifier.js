import codifier from './codifier.js'
import jsonHelper from './json.helper.js'

const SqlServerDatabaseOptions = {
  columnKeySegment: 'ID',
  defaultDataType: 'VARCHAR(200)',
  dataTypeMap: [
    {nominal: 'text', target: (scale) => `VARCHAR(${scale ?? 200})`},
    {nominal: 'character', target: () => `CHAR`},
    {nominal: 'boolean', target: () => `BIT`},
    {nominal: 'bit', target: () => `BIT`},
    {
      nominal: 'integer',
      target: (scale) => {
        // scale corresponds to number of Integer bits.
        if (!scale) return 'INT'
        if (scale <= 0) return 'BIT'
        if (scale <= 1) return 'TINYINT'
        if (scale <= 2) return 'SMALLINT'
        if (scale <= 4) return 'INT'
        return 'BIGINT'
      },
    },
    {nominal: 'decimal', target: (scale, precision) => `DECIMAL(${scale ?? 20},${precision ?? 8})`},
    {nominal: 'identifier', target: () => 'VARCHAR(200)'},
    {nominal: 'float', target: (scale, precision) => `FLOAT(${scale ?? 20},${precision ?? 8})`},
    {nominal: 'date', target: () => `DATE`},
    {nominal: 'time', target: () => `DATETIME2(7)`},
    {nominal: 'timestamp', target: () => `DATETIME2(7)`},
    {default: true, target: () => 'VARCHAR(200)'},
  ],
}

function getDataType({type, scale, precision}, databaseOptions) {
  const dtm = databaseOptions.dataTypeMap
  let dtItem
  dtItem = dtm.find((m) => m.nominal === type)
  if (dtItem) return dtItem.target(scale, precision)
  return dtm.defaultDataType ?? 'Unknown'
}

function multiplicityRequired(multiplicityId) {
  return ['EXACTLY_ONE', 'ONE_TO_MANY'].includes(multiplicityId)
}

function multiplicityInferTable(multiplicityId) {
  return ['ONE_TO_MANY', 'ZERO_TO_MANY'].includes(multiplicityId)
}

const getDatabaseJson = (json, codifyOptions, databaseOptions) => {
  // codify everything first
  codifier.codifyJson(json, codifyOptions)

  // iterate through entities (these will be tables)
  const dbJson = {tables: []}
  json.entities.forEach((entity) => {
    const foreignKeys = []
    // populate entity info
    const table = {
      type: 'table',
      name: entity.__code,
      columns: [],
    }

    // add the primary key based on entity name
    table.columns.push({
      type: 'column',
      index: 0,
      primary: true,
      name: codifier.codifyText(`${entity.name} ${databaseOptions.columnKeySegment}`, codifyOptions),
      grain: false,
      dataType: getDataType('identififer', databaseOptions),
      required: true,
    })

    // iterate through attributes (these will be columns)
    entity.attributes.forEach((attribute, attributeIndex) => {
      // find the attribute class
      const ac = json.attributeClasses.find((x) => x.id === attribute.attributeClass?.id)
      console.log(`entity: ${entity.name}, attribute: ${attribute.name}, ac: ${ac?.name}`)
      // determine if a foreign key is warranted
      // AC specifies a reference and the entityId has a value
      const generatesFK = ac?.reference && attribute?.attributeClass?.entityId
      if (generatesFK) {
        // find the target entity
        const targetEntity = json.entities.find((x) => x.id === attribute.attributeClass?.entityId)
        console.log(`targetEntity: ${targetEntity?.name}`)
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

      table.columns.push({
        type: 'column',
        index: attributeIndex + 1,
        name: ac.reference
          ? codifier.codifyText(
              `${ac.context?.concat(' ') ?? ''}${attribute.name} ${databaseOptions.columnKeySegment}`,
              codifyOptions
            )
          : attribute.__code,
        grain: attribute.grain,
        dataType: ac.reference
          ? getDataType({type: 'identifier'}, databaseOptions)
          : getDataType(ac.scalar, databaseOptions) ?? databaseOptions.defaultDataType,

        required: multiplicityRequired(attribute.multiplicityId),
      })
    }) // END attributes

    table.foreignKeys = foreignKeys
    dbJson.tables.push(table)
  }) // END entities
  return dbJson
}

export default {getDatabaseJson, SqlServerDatabaseOptions}
