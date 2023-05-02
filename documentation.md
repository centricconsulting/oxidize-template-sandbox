# On boarding a new project on oxidize

 
## Step 1: Knowing and configuring the coding standard in oxidize

Base upon the different client requirement, you may have to configure the different component in oxidize. It is best to discuss this point with client first before creating a new project in oxidize.

### 1. Case option: There are different case options available at the moment which are:
  
<u>Camel Case</u> : This will induce camel case in your table/attribute name. e.g. Table specified as **Writeoff line** in oxidize will be automatically converted to **Writeoff_Line** 

<u>Upper Case</u> : This will induce upper case in your table/attribute name. e.g. table specified as **Writeoff line** in oxidize will be automatically converted to **WRITEOFF_LINE**   

<u>Lower Case</u> : This will induce lower case in your table/attribute name. e.g. table specified as **Writeoff line** in oxidize will be automatically converted to **writeoff_line** 

Based upon the above available case option, you can configure it in your project by including below statment in EJS template:  
For  Camel:
<code>
const codifyOptions = codifier.DatabaseCodifyOptionsCamel </code>

For Upper:  
<code> const codifyOptions = codifier.DatabaseCodifyOptions  </code>

<p style="color:red">Right now we don't have a support for configuring the EJS template in lower case We will be adding the feature in further releases.</p>

### 2. Enforce descriptor: 

Using this configuration user can specify whether the attribute name filled with the descriptor or not.

For example: if in the project you have a field named as **"Direct Written Premium"** and the attribute class of this field is specified as **Currency** and the descriptor of this attribute class is specified as **Amount** then output field name will be something like **Direct_Written_Premium_Amount**

By default this setting is turned on, You can copy and paste below code in your EJS template to turn this setting off.

<code>databaseOptions.enforceDescriptors= false</code>

### 3. Enforce Return Context: 
If a column is referring to another table then the context specified in the column will be used in the column name.

For example: If entity **Written Premium** has attribute as Term which is reference to another entity **Term** and the context specified in the column is **Fnk** then output attribute name will be **Term_Fnk** 

By default this setting is turned on, You can copy and paste below code in your EJS template to turn this setting off.
<code>databaseOptions.enforceReturnContext= false</code>

### 4. Enforce Return Entity: 
If you want to use the domain name before the name of the table then this option can be used.

For example: If entity name is  **Written Premium** and domain of this entity is **Policy**. Now if return entity is turned on(Which is by default) then the Entity name will be like **Policy_Written_Premium**

By default this setting is turned on, You can copy and paste below code in your EJS template to turn this setting off.

<code>databaseOptions.enforceReturnEntity= false</code>  

## Step 2: Creation of a project in oxidize

## Step 3: Creation of an entity in oxidize

## Step 4: Creation of attribute class in oxidize

## Step 5: Creation of attribute within entity

## Step 6: Addition of tags in Attribute class

## Step 7: Addition of relationship between two tables in oxidize.

## Step 8: Using predefined list of the templates based on the best suitable in your case

## Step 9: Generating the output of oxidize project

## Step 10: Excel upload and download to change the metadata within the project.



