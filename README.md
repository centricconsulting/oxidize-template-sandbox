# Oxidize Template Sandbox

This repository is a sandbox for developing EJS templates that will be used in the Oxidize application.

# Valuable Concepts to Learn

- Oxidize Metadata Json Structure. [Metadata Documentation](metadata.md)
- Embedded Javascript Templating. [EJS](https://ejs.co/)
- JSONPath Query. [Goessner](https://goessner.net/articles/JsonPath/), [JSONPath Plus](https://github.com/s3u/JSONPath)
- Regular Expressions. [Regex 101](https://regex101.com/)
- Javascript
  - Json ("object") and Arrays. [json.org](https://www.json.org/json-en.html)
  - Array Functions: map, filter, find, sort, indexOf, concat, etc. [Mozilla - Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
  - Destructuring. [Mozilla - Destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)
- console.log. [Mozilla - Console](https://developer.mozilla.org/en-US/docs/Web/API/Console/log)

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

The EJS template (sample: [`template.js`](input/template.ejs)) uses template tags to move between Javascript and rendered text. The following code objects are accessible for use by Javascript in the template:

- `jsonHelper` Provides JSONPath query functionality. [`json.helper.js`](src/core/json.helper.js)
- `codifier` Transforms text so that it can be used in code. [`codifier.js`](src/core/codifier.js)
- `project` Top level of the metadata object. [`metadata.json`](input/metadata.json)

This project will also look for a special **file-break tag** that will be detected and used to split files:
```javascript
@@@FILE:[<path>]@@@
```
The `<path>` is relative to the specified target directory and may include nested directories. The file-break tag must rendered on its own line.  
  
Examples:
```javascript
@@@FILE:[test/<%- entity.name.substring(0,1) %>/<%- entity.__code %>.txt]@@@
```


### **Generating Code**

Code is generated through the `CodeGenerator` class in [`generate.js`](src/generator.js).