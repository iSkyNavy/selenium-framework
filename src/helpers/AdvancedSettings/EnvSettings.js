const fs = require('fs');
const fsp = require('fs/promises');
const helpers = require('./helpers.js');
const envSettingHelpers = helpers();

function EnvSettings() {

  function parseObjectProperties(obj) {
      for (const k in obj) {
        if (envSettingHelpers.isObject(obj[k])) {
          parseObjectProperties(obj[k]);
        } else if (envSettingHelpers.hasOwnProperty(obj, k)) {
          let configInitialValue = "" + obj[k];
          if (envSettingHelpers.testEnvRegex(configInitialValue)) {
            configInitialValue = envSettingHelpers.getEnvParsedVariable(configInitialValue);
            obj[k] = envSettingHelpers.parseVariableValue(configInitialValue);
          }
        }
      }
  }
 
  this.loadJsonFileSync = function(jsonFileLocation, charset) {
    const rawApplicationJson = fs.readFileSync(jsonFileLocation, charset);
    const jsonObject = JSON.parse(rawApplicationJson);
    parseObjectProperties(jsonObject);
    return jsonObject;
  }

  this.loadJsonFile = async function(jsonFileLocation, charset) {
    const rawApplicationJson = await fsp.readFile(jsonFileLocation, charset);
    const jsonObject = JSON.parse(rawApplicationJson);
    parseObjectProperties(jsonObject);
    return jsonObject;
  }

}

module.exports = EnvSettings;
