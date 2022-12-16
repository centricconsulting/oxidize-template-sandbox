import AdmZip from "adm-zip";
import ejs from "ejs";
import codifier from "./codifier.js";
import jsonHelper from "./json.helper.js";
import databasifier from "./databasifier.js";
import Asset from "./asset.js";
/**
 * This class must be derived from the GeneratorBase class and the class name must remain "Generator".
 * @param {JSON} payload JSon object containing all nececessary information to create the asset.  The payload follows a specific structure (see core/examples.js).
 */
export default class CodeGenerator {
  constructor(payloadJson, templateScript, rootPath) {
    this.payloadJson = payloadJson;
    this.templateScript = templateScript;
    this.rootPath = rootPath;
  }

  rootPath;
  payloadJson;
  templateScript;
  fileInfos;
  fileError;

  static FileSplitRegex = /(?:^@@@FILE:\[(?<path>[\S ]+)\]@@@$)/gm;

  #globalize() {
    // global makes it possible to see these libraries in EJS
    if (!global.jsonHelper) global.jsonHelper = jsonHelper;
    if (!global.codifier) global.codifier = codifier;
    if (!global.databasifier) global.databasifier = databasifier;
  }

  generate() {
    this.#globalize();
    // generate raw output
    try {
      this.fileError = undefined;
      const script = ejs.render(this.templateScript, this.payloadJson);
      this.fileInfos = this.#splitFiles(script);
      return true;
    } catch (e) {
      this.fileError = e;
      console.log("generate Error: ", e);
      return false;
    }
  }

  #splitFiles(script) {
    const fileInfos = []; // empty array for results
    // iterate through matches
    let match;
    while ((match = CodeGenerator.FileSplitRegex.exec(script))) {
      fileInfos.push({
        root: this.rootPath,
        path: match.groups?.path,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }

    // derive content
    fileInfos.forEach((fi, index, fis) => {
      const startSplice = fi.endIndex + 1;
      const endSplice =
        index === fis.length - 1 ? script.length : fis[index + 1].startIndex;
      fi.content = script.substring(startSplice, endSplice).trim();
    });

    return fileInfos;
  }

  writeZip(targetFileName) {
    // zip the files and save
    if (!this.fileInfos) throw new Error("No files are avaiable for zipping.");
    const zip = new AdmZip();
    this.fileInfos.forEach((f) => {
      zip.addFile(f.path, Buffer.from(f.content, "utf8"));
    });
    zip.writeZip(this.rootPath.concat(`/${targetFileName}`));
  }

  writeFiles() {
    const logEntries = [];
    let failureCount = 0;
    let successCount = 0;
    this.fileInfos?.forEach((fi) => {
      try {
        if (fi.content.trim().length === 0) {
          throw new Error("File has no contents.");
        }
        // save the file
        const fileAsset = new Asset(fi.path, this.rootPath);
        fileAsset.writeFile(fi.content);
        successCount++;
        logEntries.push({
          timestamp: new Date().toISOString(),
          result: "success",
          path: fi.path,
          message: `Successfully generated file.`,
        });
      } catch (e) {
        failureCount++;
        logEntries.push({
          timestamp: new Date().toISOString(),
          result: "failure",
          path: fi.path,
          message: e.message,
        });
      }
    });

    // write a log file
    const logAsset = new Asset("_generator.log", this.rootPath);
    if (logEntries.length > 0) {
      logAsset.writeLine(`${successCount} files succeeded.`);
      logAsset.writeLine(`${failureCount} files failed.\n`);
      logEntries.forEach((entry) => {
        logAsset.writeLine(`\n${entry.timestamp} - [${entry.path}]`);
        logAsset.writeLine(`${entry.result} - ${entry.message}`);
      });
    }
    logAsset.saveFile();

    // return the summary
    return { success: successCount, failure: failureCount };
  }
}
