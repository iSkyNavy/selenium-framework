const os = require("os");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const finder = require("find-package-json");
const extract = require("extract-zip");
const jp = require("jsonpath");
const tar = require("tar-fs");
const bzip = require("unbzip2-stream");
const download = require('download');
 
function BrowserHelper() {
  this.metadata = {
    chrome: {
      stable: {
        queryVersionUrl:
          "https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json",
        jsonPathVersionExtract: "$.channels.Stable.version",
      },
      browserBinary: {
        downloadUrlTemplate: {
          Linux: {
            x64: {
              url: "https://storage.googleapis.com/chrome-for-testing-public/#version/linux64/chrome-linux64.zip",
              unpackedFolderName: "chrome-linux64",
              unpackedExecutableName: "chrome",
            },
          },
          Windows_NT: {
            x64: {
              url: "https://storage.googleapis.com/chrome-for-testing-public/#version/win64/chrome-win64.zip",
              unpackedFolderName: "chrome-win64",
              unpackedExecutableName: "chrome.exe",
            },
          },
          Darwin: {
            x64: {
              url: "https://storage.googleapis.com/chrome-for-testing-public/#version/mac-x64/chrome-mac-x64.zip",
              unpackedFolderName: "chrome-mac-x64",
              unpackedExecutableName: "Chromium.app/Contents/MacOS/Chromium", // ruta dentro del .app
            },
            arm64: {
              url: "https://storage.googleapis.com/chrome-for-testing-public/#version/mac-arm64/chrome-mac-arm64.zip",
              unpackedFolderName: "chrome-mac-arm64",
              unpackedExecutableName: "/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
            },
          },
        },
      },
      browserDriver: {
        downloadUrlTemplate: {
          Linux: {
            x64: {
              url: "https://storage.googleapis.com/chrome-for-testing-public/#version/linux64/chromedriver-linux64.zip",
              unpackedFolderName: "chromedriver-linux64",
              unpackedExecutableName: "chromedriver",
            },
          },
          Windows_NT: {
            x64: {
              url: "https://storage.googleapis.com/chrome-for-testing-public/#version/win64/chromedriver-win64.zip",
              unpackedFolderName: "chromedriver-win64",
              unpackedExecutableName: "chromedriver.exe",
            },
          },
          Darwin: {
            x64: {
              url: "https://storage.googleapis.com/chrome-for-testing-public/#version/mac-x64/chromedriver-mac-x64.zip",
              unpackedFolderName: "chromedriver-mac-x64",
              unpackedExecutableName: "chromedriver",
            },
            arm64: {
              url: "https://storage.googleapis.com/chrome-for-testing-public/#version/mac-arm64/chromedriver-mac-arm64.zip",
              unpackedFolderName: "chromedriver-mac-arm64",
              unpackedExecutableName: "chromedriver",
            },
          },
        },
      }
    },
    firefox: {
      stable: {
        queryVersionUrl:
          "https://product-details.mozilla.org/1.0/firefox_versions.json",
        jsonPathVersionExtract: "$.LATEST_FIREFOX_VERSION",
      },
      downloadUrlTemplate: {
        Linux: {
          x64: {
            url: "https://ftp.mozilla.org/pub/firefox/releases/#version/linux-x86_64/en-US/firefox-#version.tar.bz2",
            unpackedFolderName: "firefox",
          },
        },
        Windows_NT: {
          x64: {
            url: "https://ftp.mozilla.org/pub/firefox/candidates/#version-candidates/build1/win32/en-US/firefox-#version.zip",
            unpackedFolderName: "firefox",
          },
        },
      },
    },
  };
 
  this.getVersionByBuildId = async (browser, buildId) => {
    const queryUrl = this.metadata[browser][buildId]["queryVersionUrl"];
    const jsonPathVersionExtract = this.metadata[browser][buildId]["jsonPathVersionExtract"]
    const axiosResponse = await axios.get(queryUrl);
    const version = jp.value(
      axiosResponse.data,
      jsonPathVersionExtract
    );
    return version;
  }
 
  this.downloadBrowserBinary = async (browser, version) => {
    const platform = os.type();
    console.log(platform, '--downloadBrowserBinary--')
    const arch = process.arch;
    return await downloadFile(platform, arch, browser, version, this.metadata[browser]["browserBinary"]);
  };
 
  this.downloadBrowserDriver = async (browser, version) => {
    const platform = os.type();
    const arch = process.arch;
    return await downloadFile(platform, arch, browser, version, this.metadata[browser]["browserDriver"]);
  };
 
  async function downloadFile(platform, arch, browser, version, downloadMetadata) {
 
    const unpackedFolderName = downloadMetadata["downloadUrlTemplate"][platform][arch]["unpackedFolderName"];
    const unpackedExecutableName = downloadMetadata["downloadUrlTemplate"][platform][arch]["unpackedExecutableName"];
    const f = finder(__filename);
    const frameworkLocation = path.dirname(f.next().filename);
    const destinationBrowserFolder = path.join(
      frameworkLocation,
      `.${browser}`,
      version,
      platform,
      arch
    );
    const unpackDestination = destinationBrowserFolder;
    const executableLocation = path.join(
      unpackDestination,
      unpackedFolderName,
      unpackedExecutableName
    );
 
    if (fs.existsSync(executableLocation)) {
      //@TODO: force deletion
      return { executableLocation };
    }
 
    const downloadUrlTemplate =
      downloadMetadata["downloadUrlTemplate"][platform][arch]["url"];
 
    const downloadUrl = downloadUrlTemplate.replace(/#version/g, version);
    const compressedFileLocation = path.join(
      destinationBrowserFolder,
      downloadUrl.split("/").pop()
    );
 
    console.log(`Downloading ${unpackedFolderName} ${version} : ${downloadUrl}`);
    console.log(`Destination ${compressedFileLocation}`)
 
    await downloadFileFomrUrl(downloadUrl, compressedFileLocation);
 
    if (compressedFileLocation.endsWith(".zip")) {
      await extract(compressedFileLocation, { dir: unpackDestination });
    } else if (compressedFileLocation.endsWith(".tar.bz2")) {
      await extractTar(compressedFileLocation, unpackDestination);
    } else {
      throw new Error("Unsupported file compression. Allowed: zip, .tar.bz2");
    }
 
 
    console.log("Extraction complete. File location: " + executableLocation);
    //delete the downloaded files (zip, etc)
    await fs.promises.rm(compressedFileLocation, { recursive: true });
    return { executableLocation };
  }
 
  async function downloadFileFomrUrl(urlString, dest) {
    await fs.promises.mkdir(path.dirname(dest), { recursive: true })
    await download(urlString, path.dirname(dest));
  }
 
  async function extractTar(tarPath, folderPath) {
    return new Promise((fulfill, reject) => {
      const tarStream = tar.extract(folderPath);
      tarStream.on("error", reject);
      tarStream.on("finish", fulfill);
      const readStream = fs.createReadStream(tarPath);
      readStream.pipe(bzip()).pipe(tarStream);
    });
  }
}
 
module.exports = BrowserHelper;