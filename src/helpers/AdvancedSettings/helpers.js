/**
 *
 *
 * @returns {{parseVariableValue: (configInitialValue: string) => any, getEnvParsedVariable: (configInitialValue: string) => string, isObject: (potentialObj) => boolean, hasOwnProperty: (obj, property) => boolean, testEnvRegex: (testValue: string) => boolean}}
 */
function envSettingsHelpers() {
    const helpers = {};
    const regex = new RegExp("\\$\\{([^}\\s]*)\\}");
  
    helpers.isObject = (potentialObj) => {
      if (
        typeof potentialObj === 'object' && 
        potentialObj !== null && 
        Object.keys(potentialObj).length !== 0) {
        return true;
      }
      return false;
    }
  
    helpers.hasOwnProperty = (obj, property) => {
      if (obj.hasOwnProperty(property)) {
        return true;
      }
      return false;
    }
  
    helpers.testEnvRegex = (testValue) => {
      if (regex.test(testValue)) {
        return true;
      }
      return false;
    }
  
    helpers.getEnvParsedVariable = (configInitialValue) => {
      const startIndex = configInitialValue.indexOf("${") + 2;
      const endIndex = configInitialValue.indexOf("}");
      const environmentKey = configInitialValue.substring(startIndex , endIndex - startIndex + 2 );
      const environmentValue = process.env[environmentKey];
      if(typeof environmentValue !== 'undefined'){
        return configInitialValue.replace("${" + environmentKey + "}" , environmentValue);
      }
      return configInitialValue;
    }
  
    helpers.parseVariableValue = (configInitialValue) => {
      if(configInitialValue == "true" || configInitialValue == "false"){
        const isTrueSet = (configInitialValue === "true");
        return isTrueSet;
      }
      else{
        return configInitialValue;
      }
    }
  
    return helpers;
  }
  
  module.exports = envSettingsHelpers;