# Oxidize Metadata Documentation

### **Common Document Properties**  
All documents share a common set of properties.  Most documents have other properties in addition to those listed below.

```
{
  id: ...
  type: ...,
  name: ...,
  definition: ...,
  projectId: ...
  entityId: ...
  tags: [...],
  config: { ... }
  createTimestamp: ...,
  modify: {
    userId: ...,
    userName: ...,
    timestamp: ...
  },

}
```

- `id` **{String}** Globally unique identifier for the document.
- `type` **{String}** Text field indicating the type of document.
- `name` **{String}** Name of the document unique for the document type within a given project.
- `definition` **{String}** Description or definition of the document.
- `projectId` **{String}** Identifier of the Project document to which the document belongs.
- `entityId` **{String}** *Only provided for Entity, Attribute and Instance documents.* Identifier of the Entity document to which the document belongs.
- `tags` **{Array\<String\>}** List of text values specifically instructing code generation.
- `config` **{JSON}** Configuration values specifically instructing code generation.
- `createTimestamp` **{String}** Representation of the UTC timestamp at which the document was created.
- `modify` **{JSON}** Container for modify information.
- `modify.userId` **{String}** Oxidize user identifier (generally an email addres) of the user who last modified the document.
- `modify.userName` **{String}** Full name of the user who last modified the document.
- `modify.timestamp` **{String}** Representation of the UTC timestamp at which the document was modified.

### **Documents and References to Other Documents**
Each document type is listed below.  References to other documents are identified in the structure. Note that most scalar properties are not shown.

**`Project`:**  
Repesents a collection of metadata.

```
{
  type: "project",
  entities: [...],
  metrics: [...],
  terminologies: [...],
  sources: [...],
  attributeClasses: [...],
  modules: [...],
  projectId: ...,
  ...
}
```

- `entities` **{Array\<String\>}** List of identifiers for Entity documents contained in the Project.
- `metrics` **{Array\<String\>}** List of identifiers for Metric documents contained in the Project.
- `terminologies` **{Array\<String\>}** List of identifiers for Terminology documents contained in the Project.
- `sources` **{Array\<String\>}** List of identifiers for Sources documents contained in the Project.
- `attributeClasses` **{Array\<String\>}** List of identifiers for Attribute Class documents contained in the Project.
- `modules` **{Array\<String\>}** List ofidentifiers for  Module documents contained in the Project.
- `projectId` **{String}** *`id` and `projectId` will be identical for project documents .* Identifier of the Project document in which the Project document is contained.

**`Entity`:**  
Business concept.

```
{
  type: "entity",
  attributes: [...],
  instances: [...],
  projectId: ...,
  ...
}
```

- `attributes` **{Array\<String\>}** List of identifiers for Attribute documents contained in the Entity.
- `instances` **{Array\<String\>}** List of identifiers for Instance documents contained in the Entity.
- `entityId` **{String}** *`id` and `entityId` will be identical for Entity documents .* Identifier of the Entity document in which the Entity document is contained.
- `projectId` **{String}** Identifier of the Project document in which the Entity document is contained.

**`Attribute`** (child of Entity):  
A value that describes the current state of an entity. Through multiplicity an attribute may represent one-to-many scalar values or references to another entity.

```
{
  type: "attribute"
  attributeClass: {
    id: ...,
    entityId: ...
  },
  entityId: ...,
  projectId: ...,
  ...
}
```

- `attributeClass` **{JSON}** Container for Attribute Class information assigned to the Attribute.
- `attributeClass.id` **{String}** Identifer of the Attribute Class document assigned to the Attribute.
- `attributeClass.entityId` **{String}** *Only valid for Attribute Classes with scalar type of `Entity`.* Identifier of the Entity document referenced in the Attribute Class.
- `entityId` **{String}** Identifier of the Entity document in which the Entity document is contained.
- `projectId` **{String}** Identifier of the Project document in which the Attribute document is contained.

**`Instance`** (child of Entity):  
Instantiation of an entity, providing a value for each scalar attribute of the entity.

```
{
  type: "instance"
  values: [
    {attributeId: ..., value: ...},
    {attributeId: ..., value: ...},
    {attributeId: ..., value: ...}
    ...
    entityId: ...,
    projectId: ...,
  ],
  ...
}
```

- `values` **{Array\<JSON\>}** List of Attributes and corresponding values.
- `values[].attributeId` **{String}** Identifier of the Attribute document for which a value is provided. This will be a scalar Attribute in the same Entity as the Instance.
- `values[].value` **{String}** Value for the specified attribute.
- `entityId` **{String}** Identifier of the Entity document in which the Instance document is contained.
- `projectId` **{String}** Identifier of the Project document in which the Instance document is contained.


**`Metric`:**  
Derivation that takes one-or-more inputs and produces a result or collection of results.

```
{
  type: "metric",
  inputs: {
    metric: [...],
    attribute: [...]
  },
  attributeClass: {
    id: ...,
    entityId: ...
  },
  projectId: ...,
  ...
}
```

- `inputs` **{JSON}** Container for inputs to the calculation of the Metric formula.
- `inputs.metric` **{Array\<String\>}** List of identifiers for Metric documents that are inputs to the Metric formula.
- `inputs.attribute` **{Array\<String\>}** List of identifiers for Attribute documents that are inputs to the Metric formula.
- `attributeClass` **{JSON}** Container for Attribute Class information assigned to the Metric.
- `attributeClass.id` **{String}** Identifer of the Attribute Class document assigned to the Metric.
- `attributeClass.entityId` **{String}** *Only valid for Attribute Classes with scalar type of `Entity`.* Identifier of the Entity document referenced in the Attribute Class.
- `projectId` **{String}** Identifier of the Project document in which the Metric document is contained.

**`Terminology`:**  
Terminology or vernacular used in the business, but not applicable as an Entity, Metric or Attribute.

```
{
  type: "terminology",
  projectId: ...,
  ...
}
```

- `projectId` **{String}** Identifier of the Project document in which the Terminology document is contained.

**`Source`:**  
Source sytem defined for an implementation.

```
{
  type: "source",
  projectId: ...,
  ...
}
```

- `projectId` **{String}** Identifier of the Project document in which the Source document is contained.

**`Atrribute Class`:**  
Functional type that describes an attribute or metric.

```
{
  type: "attributeClass",
  projectId: ...,
  ...
}
```

- `projectId` **{String}** Identifier of the Project document in which the Attribute Class document is contained.

**`Module`:**  
Packaging of objects for deployment.

```
{
  type: "module",
  includes: {
    metric: [...],
    entity: [...],
    attribute: [...],
    module: [...],
  }
  projectId: ...,
  ...
}
```

- `includes` **{JSON}** Container for document specification for the Module.
- `includes.metric` **{Array\<String\>}** List of identifiers for Metric documents that are included in the Module.
- `includes.entity` **{Array\<String\>}** List of identifiers for Entity documents that are included in the Module.
- `includes.attribute` **{Array\<String\>}** List of identifiers for Attribute documents that are included in the Module.
- `includes.module` **{Array\<String\>}** List of identifiers for Module documents that are included in the Module.

### **Steps to Resolving Documents in Modules**

1. Accrue all documents directly or recursively referenced through `includes.module`.
2. Accure all Metric documents  directly or recursively referenced through `includes.metric`.
3. Accrue all Attribute documents directly referenced in accrued Metrics.
4. Accrue all Attribute documents directly referenced in `includes.attributes`.
5. Accrue all Entity documents directly referenced in accrued Attributes.
6. Accrue all Entity documents directly referenced in `includes.entity`.

