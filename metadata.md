# Oxidize Metadata Documentation

## **Metadata Top-Level Structure**  

Metadata is presented as a Json document.  At the top-level of metadata document are the following objects:

```javascript
{
  project: {...},
  sources: [...],
}
```

- `project` **{JSON}** Container for `Project` document and its children.
- `sources` **{Array\<JSON\>}** List of `Source` documents that will be used to generate templates.

----

## **Common Document Properties**  

All documents share a common set of properties, regardless of document type.

```javascript
{
  id: ...,
  type: ...,
  name: ...,
  definition: ...,
  projectId: ...,
  entityId: ...,
  tags: [...],
  config: { ... },
  createTimestamp: ...,
  modify: {
    userId: ...,
    userName: ...,
    timestamp: ...,
  },
  active: ...,
}
```

- `id` **{String}** Globally unique identifier for the document.
- `type` **{String}** Text field indicating the type of document.
- `name` **{String}** Name of the document unique for the document type within a given project.
- `definition` **{String}** Description or definition of the document.
- `projectId` **{String}** Identifier of the `Project` document to which the document belongs.
- `tags` **{Array\<String\>}** List of text values specifically instructing code generation.
- `config` **{JSON}** Configuration values specifically instructing code generation.
- `createTimestamp` **{String}** Representation of the UTC timestamp at which the document was created.
- `modify` **{JSON}** Container for modify information.
- `modify.userId` **{String}** Oxidize user identifier (generally an email addres) of the user who last modified the document.
- `modify.userName` **{String}** Full name of the user who last modified the document.
- `modify.timestamp` **{String}** Representation of the UTC timestamp at which the document was modified.
- `active` **{Boolean}** Indicates whether the document is Active for the purpose of packaging in Modules.

----

## **Document Specifications**

Individual documents properties are specified below. The `type` common property is defined as a distinct **{String}** literal for each type of document. Other common properties (listed above) are not shown in the following specifications.

----

### **`Project` Document**  

Repesents a collection of documents describing an information space.

```javascript
{
  type: "project",
  entities: [...],
  metrics: [...],
  terminologies: [...],
  attributeClasses: [...],
  modules: [...],
  projectId: ...,
}
```

- `entities` **{Array\<String\>}** List of identifiers for `Entity` documents contained in the `Project`.
- `metrics` **{Array\<String\>}** List of identifiers for `Metric` documents contained in the `Project`.
- `terminologies` **{Array\<String\>}** List of identifiers for `Terminology` documents contained in the `Project`.
- `attributeClasses` **{Array\<String\>}** List of identifiers for `Attribute Class` documents contained in the `Project`.
- `modules` **{Array\<String\>}** List of identifiers for `Module` documents contained in the `Project`.
- `projectId` **{String}** *`id` and `projectId` will be identical for `Project` documents .*

----

### **`Entity` Document**  

Document, transaction, process, entity or other definable concept.

```javascript
{
  type: "entity",
  attributes: [...],
  instances: [...],
  entityId: ...,
}
```

- `attributes` **{Array\<String\>}** List of identifiers for `Attribute` documents contained in the `Entity`.
- `instances` **{Array\<String\>}** List of identifiers for `Instance` documents contained in the `Entit`y.
- `entityId` **{String}** *`id` and `entityId` will be identical for `Entity` documents .* Identifier of the `Entity` document.

----

### **`Attribute` Document** (Child of `Entity`)  

A value that describes the current state of an Entity. Through `Multiplicity` an `Attribute` may represent one-to-many scalar values or references to other `Entity` documents.

```javascript
{
  type: "attribute",
  grain: ...,
  qualityRule: ...,
  multiplicityId: ...,
  derivation: ...,
  attributeClass: {
    id: ...,
    entityId: ...,
    context: ...,
  },
  entityId: ...,
}
```

- `grain` **{Boolean}** Indicates whether the `Attribute` defines uniqueness of its parent `Entity`, potentially among other *grain* Attributes.
- `qualityRule` **{String | RegExp}** Description of how quality is assessed for the `Attribute`. A Regex literal may also be provided.
- `multiplicityId` **{String}** Identifier of the `Multiplicity`, specifying the number of `Attributes` that may be assigned to the `Entity`.
- `derivation` **{String}** Description of how the `Attribute` is derived, if applicable.
- `attributeClass` **{JSON}** Container for `Attribute Class` information assigned to the `Attribute`.
- `attributeClass.id` **{String}** Identifer of the `Attribute Class` document assigned to the `Attribute`.
- `attributeClass.entityId` **{String}** *Only valid for `Attribute Class` references with scalar type of `Entity`.* Identifier of the `Entity` document referenced in the `Attribute Class`.
- `attributeClass.context` **{String}** Text describing the context of the referenced `Entity` relative to the `Attribute`.
- `entityId` **{String}** Identifier of the `Entity` document in which the `Attribute` is contained.

----

### **`Instance` Document** (Child of `Entity`)  

Instantiation of an `Entity`, providing a value for each scalar `Attribute` of the `Entity`.

```javascript
{
  type: "instance",
  values: [
    {attributeId: ..., value: ...},
    {attributeId: ..., value: ...},
    {attributeId: ..., value: ...},
  ],
  entityId: ...,
}
```

- `values` **{Array\<JSON\>}** List of `Attributes` and corresponding values.
- `values[x].attributeId` **{String}** Identifier of the `Attribute` document for which a value is provided. This will be a scalar `Attribute` in the same `Entity` as the `Instance`.
- `values[x].value` **{String}** Value for the specified `Attribute`.
- `entityId` **{String}** Identifier of the `Entity` document in which the `Instance` is contained.

----

### **`Metric` Document**  

Derivation that takes one-or-more inputs and produces a result or collection of results.

```javascript
{
  type: "metric",
  qualityRule: ...,
  multiplicityId: ...,
  formula: ...,
  methodology: ...,
  input: {
    metrics: [...],
    attributes: [...],
  },
  attributeClass: {
    id: ...,
    entityId: ...,
    context: ...,
  },
}
```

- `qualityRule` **{String | RegExp}** Description of how quality is assessed for the `Attribute`. A Regex literal may also be provided.
- `multiplicityId` **{String}** Identifier of the `Multiplicity`, specifying the number of values that may result from a `Metric` `formula` calculation.
- `formula` **{String}** Specifies the mathematical derivation or shorthand for calculating the `Metric` result.
- `methodology` **{String}** Describes the approach for calculation the `Metric` result under different scenarios, e.g., time range, special conditions.
- `input` **{JSON}** Container for inputs to the calculation of the `Metric` `formula`.
- `input.metrics` **{Array\<String\>}** List of identifiers for `Metric` documents that are inputs to the `Metric` `formula`.
- `input.attributes` **{Array\<String\>}** List of identifiers for `Attribute` documents that are inputs to the `Metric` `formula`.
- `attributeClass` **{JSON}** Container for `Attribute Class` information assigned to the `Metric`.
- `attributeClass.id` **{String}** Identifer of the `Attribute Class` document assigned to the `Metric`.
- `attributeClass.entityId` **{String}** *Only valid for `Attribute Class` references with scalar type of `Entity`.* Identifier of the `Entity` document referenced in the `Attribute Class`.
- `attributeClass.context` **{String}** Text describing the context of the referenced `Entity` relative to the `Metric` result.

----

### **`Terminology` Document**  

Terminology or vernacular used in the business, but not applicable as an `Entity`, `Metric` or `Attribute`.

```javascript
{
  type: "terminology",
}
```

----

### **`Source` Document**  

Source sytem defined for an implementation.

```javascript
{
  type: "source",
  platform: ...,
  vendor: ...,
  operational: ...,
  domain: ...,
  scope: ...,
}
```

- `platform` **{String}** Name of the software product or platform.
- `vendor` **{String}** Name of the organization that develops or maintains the `platform`.
- `operational` **{Boolean}** Indicates whether the `Source` currently supports business operations.
- `domain` **{String}** Describes the business domains, departments or functional areas addressed through the `platform`.
- `scope` **{String}** Describes the segmentations of data contained within the `Source`, e.g., years of history, subsets of business operations.

----

### **`Atrribute Class` Document**  

Semantic type that describes the function of an `Attribute` or `Metric`.

```javascript
{
  type: "attributeClass",
  descriptor: ...,
  variations: [...],
  scalarType: ...,
  reference: ...,
}
```

- `descriptor` **{String}** Text that indicates the `Attribute Class` in the `name` property of an `Attribute` or `Metric`.
- `variations` **{String}** List of text values that may be deemed equiavalent to the `descriptor` property.
- `scalarType` **{String}** Simple data type inferred by the `Attribute Class`.  Values include \["string", "integer", "decimal", "date", "time", "timestamp", "boolean" \].
- `reference` **{Boolean}** Indicates of the `Attribute Class` requires a reference to an `Entity`.

----

### **`Module` Document**  

Packaging of objects for deployment.

```javascript
{
  type: "module",
  include: {
    all: ...
    metrics: [...],
    entities: [...],
    attributes: [...],
    modules: [...],
  },
  projectId: ...,
}
```

- `include` **{JSON}** Container for document specification for the `Module`.
- `include.all` **{Boolean}** Indicates whether all `Metric`, `Entity`, `Attributes` and `Module` documents should be included.  If `true`, other properties of `include` will be ignored.
- `include.metrics` **{Array\<String\>}** List of identifiers for `Metric` documents that are included in the `Module`.
- `include.entities` **{Array\<String\>}** List of identifiers for `Entity` documents that are included in the `Module`.
- `include.attributes` **{Array\<String\>}** List of identifiers for `Attribute` documents that are included in the `Module`.
- `include.modules` **{Array\<String\>}** List of identifiers for `Module` documents that are included in the `Module`.

### **Steps to Resolving `Module`-Included Documents**

1. Accrue all documents directly or recursively referenced through `include.modules`.
2. Accrue all `Metric` documents  directly or recursively referenced through `includes.metrics`.
3. Accrue all `Attribute` documents directly referenced in accrued `Metrics`.
4. Accrue all `Attribute` documents directly referenced in `include.attributes`.
5. Accrue all `Entity` documents directly referenced in accrued `Attributes`.
6. Accrue all `Entity` documents directly referenced in `include.entities`.
