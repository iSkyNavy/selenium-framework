const path = require("path")
const fs = require("fs")
const BrowserHelper = require("../../src/browsers/BrowserHelper.js");

describe('BrowserHelper', () => {
    test('should download chrome browser binary', async () => {
        const browserLocation = path.join(process.cwd(), ".chrome");
        if (fs.existsSync(browserLocation)) {
            await fs.promises.rm(browserLocation, { recursive: true });  
        }            
        const browserHelper = new BrowserHelper();
        const version = await browserHelper.getVersionByBuildId("chrome", "stable");
        const response = await browserHelper.downloadBrowserBinary("chrome", version);
        const exist = fs.existsSync(response.executableLocation);
        expect(exist).toBe(true)
    });

    test('should download chrome browser driver', async () => {
        const browserLocation = path.join(process.cwd(), ".chrome");
        if (fs.existsSync(browserLocation)) {
            await fs.promises.rm(browserLocation, { recursive: true });  
        }            
        const browserHelper = new BrowserHelper();
        const version = await browserHelper.getVersionByBuildId("chrome", "stable");
        const response = await browserHelper.downloadBrowserDriver("chrome", version);
        const exist = fs.existsSync(response.executableLocation);
        expect(exist).toBe(true)
    });  
});