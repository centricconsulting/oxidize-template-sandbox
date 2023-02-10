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
      return defaultName
    },
  },
  foreignAttributeName: {
    prepare: (defaultName, attribute, foreignEntity) => {
      return defaultName
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
        if (attributeClass.precision <= 1) return 'SMALLINT'
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

const SnowflakeDatabaseOptions = {
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
      return defaultName
    },
  },
  foreignAttributeName: {
    prepare: (defaultName, attribute, foreignEntity) => {
      return defaultName
    },
  },
  defaultDataType: 'VARCHAR(200)',
  keyDataType: 'VARCHAR(300)',
  dataTypeMap: [
    {
      nominal: 'text',
      target: (attributeClass) => `VARCHAR(${attributeClass.precision ?? 200})`,
    },
    {nominal: 'character', target: () => `VARCHAR(1)`},
    {nominal: 'boolean', target: () => `BIT`},
    {nominal: 'bit', target: () => `BIT`},
    {
      nominal: 'integer',
      target: () => 'NUMBER',
    },
    {
      nominal: 'decimal',
      target: (attributeClass) => {
        const precision = attributeClass?.precision ?? 38
        const scale = attributeClass?.scale ?? 12
        return `NUMBER(${precision},${scale})`
      },
    },
    {
      nominal: 'float',
      target: () => `FLOAT`,
    },
    {
      nominal: 'bytes',
      target: (attributeClass) => {
        if (attributeClass?.precision > 0) {
          return `BINARY(${attributClass.precision})`
        } else {
          return `BINARY(8388608)`
        }
      },
    },
    {nominal: 'date', target: () => `DATE`},
    {nominal: 'time', target: () => `TIME`},
    {nominal: 'timestamp', target: () => `DATETIME`},
    {
      default: true,
      target: (attributeClass) => `VARCHAR(${attributeClass?.precision ?? 200})`,
    },
  ],
}

const DeltaLakeDatabaseOptions = {
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
      return defaultName
    },
  },
  foreignAttributeName: {
    prepare: (defaultName, attribute, foreignEntity) => {
      return defaultName
    },
  },
  defaultDataType: 'string',
  keyDataType: 'string',
  dataTypeMap: [
    {
      nominal: 'text',
      target: (attributeClass) => `string`,
    },
    {nominal: 'character', target: () => `string`},
    {nominal: 'boolean', target: () => `boolean`},
    {nominal: 'bit', target: () => `int`},
    {
      nominal: 'integer',
      target: (attributeClass) => {
        // precision corresponds to number of Integer bytes.
        if (!attributeClass.precision) return 'int'
        if (attributeClass.precision <= 0) return 'smallint'
        if (attributeClass.precision <= 1) return 'smallint'
        if (attributeClass.precision <= 2) return 'smallint'
        if (attributeClass.precision <= 4) return 'int'
        return 'bigint'
      },
    },
    {
      nominal: 'decimal',
      target: (attributeClass) => {
        if (attributeClass.name.toLowerCase() === 'currency') {
          return 'decimal'
        } else {
          return `decimal`
        }
      },
    },
    {nominal: 'identifier', target: () => 'string'},
    {
      nominal: 'float',
      target: (attributeClass) => `float`,
    },
    {nominal: 'date', target: () => `date`},
    {nominal: 'time', target: () => `timestamp`},
    {nominal: 'timestamp', target: () => `timestamp`},
    {
      default: true,
      target: (attributeClass) => `string`,
    },
  ],
}

const AzureDataFactoryDatabaseOptions = {
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
      return defaultName
    },
  },
  foreignAttributeName: {
    prepare: (defaultName, attribute, foreignEntity) => {
      return defaultName
    },
  },
  defaultDataType: 'String',
  keyDataType: 'String',
  dataTypeMap: [
    {nominal: 'text', target: () => `String`},
    {nominal: 'character', target: () => `String`},
    {nominal: 'boolean', target: () => `Boolean`},
    {nominal: 'bit', target: () => `Bit`},
    {
      nominal: 'integer',
      target: () => {
        return 'INT'
      },
    },
    {
      nominal: 'decimal',
      target: () => 'Decimal',
    },
    {nominal: 'identifier', target: () => 'String'},
    {nominal: 'float', target: () => `Decimal`},
    {nominal: 'date', target: () => `DateTime`},
    {nominal: 'time', target: () => `DateTime`},
    {nominal: 'timestamp', target: () => `DateTime`},
    {default: true, target: () => 'String'},
  ],
}

export default {
  SqlServerDatabaseOptions,
  DeltaLakeDatabaseOptions,
  AzureDataFactoryDatabaseOptions,
  SnowflakeDatabaseOptions,
}
