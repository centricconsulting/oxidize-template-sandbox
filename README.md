# Oxidize Template Sandbox

This repository is a sandbox for developing EJS templates that will be used in the Oxidize application.

# Concepts You Should Master

- Oxidize Metadata Json Structure ([see below](https://github.com/centricconsulting/oxidize-template-sandbox#oxidize-metadata-json-structure))
- Embedded Javascript Templating [EJS](https://ejs.co/)
- JSONPath Query [Goessner](https://goessner.net/articles/JsonPath/) and [JSONPath Plus](https://github.com/s3u/JSONPath)
- Regex - [Regex 101](https://regex101.com/)
- Javascript
  - Json ("object") and Arrays [json.org](https://www.json.org/json-en.html)
  - Array Functions: map, filter, find, sort, indexOf, concat, etc. [Mozilla - Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
  - Destructuring [Mozilla - Destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)
- console.log [Mozilla - Console](https://developer.mozilla.org/en-US/docs/Web/API/Console/log)

# Installation Steps

### **Prepare Environment**

1. Install Visual Studio Code. [VS Code Download](https://code.visualstudio.com/download)
2. Install Node. [Node Download](https://nodejs.org/en/download/)
3. Open Visual Studio Code.
4. Install Yarn - Open terminal window and type `npm install yarn`

### **Prepare and Run the Project**

1. Load this repository onto you local desktop.
2. Open the root folder of the repository in VS Code
3. Open the terminal window and type `yarn install`. This will pull down all the packages for this repository.
4. In the terminal window type `yarn run start`.

# Recommendations

- Install the VSCode Extension: EJS language support
- Examine demos for `codifier` and `jsonHelper`
- Exensively use `console.log` for troublshooting.

# Templated Code Generation

### **EJS Template**

The EJS template [sample](input/template.ejs) uses template tags to move between Javascript and rendered text. The following code objects are accessible for use by Javascript in the template:

- `jsonHelper` Provides JSONPath query functionality. [`json.helper.js`](src/core/json.helper.js)
- `codifier` Transforms text so that it can be used in code. [`codifier.js`](src/core/codifier.js)
- `project` Top level of the metadata object. [`metadata.json`](input/metadata.json)

This project will also look for a special file-break tag that will be detected and used to split files. The `<path>` is relative to the specified target directory and may include nested directories.
```
@@@FILE:[<path>]@@@
```
Examples:
```
@@@FILE:[test/<%- entity.name.substring(0,1) %>/<%- entity.__code %>.txt]@@@
```


### **Generating Code**

Code is generated through the `CodeGenerator` class in [`generate.js`](src/generator.js).

# Oxidize Metadata Json Structure

The Oxidize Metadata Json structure is as follows. Note that most scalar properties are not shown below.

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
  ...
}
```

**`Entity`:**  
Business concept.

```
{
  type: "entity",
  attributes: [...],
  instances: [...],
  ...
}
```

**`Entity > Attribute`:**  
A value that describes the current state of an entity. Through multiplicity an attribute may represent one-to-many scalar values or references to another entity.

```
{
  type: "attribute"
  attributeClass: {
    id: ...,
    entityId: ...
  },
  ...
}
```

**`Entity > Instance`:**  
Instantiation of an entity, providing a value for each scalar attribute of the entity.

```
{
  type: "instance"
  values: [
    {attributeId: ..., value: ...},
    {attributeId: ..., value: ...},
    {attributeId: ..., value: ...}
    ...
  ],
  ...
}
```

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
  ...
}
```

**`Terminology`:**
Terminology or vernacular used in the business, but not applicable as an Entity, Metric or Attribute.

```
{
  type: "terminology",
  ...
}
```

**`Source`:**
Source sytem defined for an implementation.

```
{
  type: "source",
  ...
}
```

**`Atrribute Class`:**
Functional type that describes an attribute or metric.

```
{
  type: "attributeClass",
  ...
}
```

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
  ...
}
```
