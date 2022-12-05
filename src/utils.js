const fs = require("fs");
const os = require("os");
const readline = require('readline');
const rimraf = require('rimraf')
const fsExtra = require("fs-extra");
const config = require("./config");
const glob = require("glob");
const path = require("path");
const package = require("../package.json");
const { projectDir } = require("./config");
const sumoDir = config.sumoDir;
const baselineDir = config.baselineDir;
const contractsDir = config.contractsDir;
const contractsGlob = config.contractsGlob;
const buildDir = config.buildDir;
const testDir = config.testDir;
const packageManagerGlob = config.packageManagerGlob;
const testsGlob = config.testsGlob;


/**
 * deletes the .sumo folder
 */
function cleanSumo() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  if (!fs.existsSync(sumoDir)) {
    console.log("Nothing to delete")
    process.exit(0)
  }
  rl.question("If you delete the '.sumo' directory you will lose the mutation testing data. Do you want to proceed? y/n > ", function (response) {
    response = response.trim()
    response = response.toLowerCase()
    if (response === 'y' || response === 'yes') {
      fsExtra.remove(sumoDir);
      console.log("'.sumo directory' deleted!")
      rl.close()
    }
    else {
      rl.close()
    }
  })
}


/**
 * restores the SUT files
 */
function restore() {

  if (fs.existsSync(baselineDir)) {

    glob(baselineDir + contractsGlob, (err, files) => {
      if (err) throw err;

      //Restore contracts
      glob(baselineDir + '/contracts' + contractsGlob, (err, files) => {
        if (err) throw err;

        for (const file of files) {
          let relativeFilePath = file.split(".sumo/baseline/contracts")[1];
          let fileDir = path.dirname(relativeFilePath);
          fs.mkdir(contractsDir + fileDir, { recursive: true }, function (err) {
            if (err) return cb(err);

            fs.copyFile(file, contractsDir + relativeFilePath, (err) => {
              if (err) throw err;
            });
          });
        }
      });

      //Restore tests
      glob(baselineDir + '/test' + testsGlob, (err, files) => {
        if (err) throw err;

        for (const file of files) {
          let relativeFilePath = file.split(".sumo/baseline/test")[1];
          let fileDir = path.dirname(relativeFilePath);
          fs.mkdir(testDir + fileDir, { recursive: true }, function (err) {
            if (err) return cb(err);

            fs.copyFile(file, testDir + relativeFilePath, (err) => {
              if (err) throw err;
            });
          });
        }
      });


    });
    console.log("> Project restored.");
  } else {
    console.log("> Project was not restored (No baseline available).");
  }
}

/**
 * Cleans the build dir
 */
function cleanBuildDir() {
  if (fs.existsSync(buildDir)) {
    fsExtra.emptyDirSync(buildDir);
    console.log("> Build directory cleaned.");
  } else {
    console.log("> Build directory is already empty.");
  }
}

/**
 * Cleans the temporary files generated by Ganache
 */
function cleanTmp() {
  var dir = os.tmpdir();
  fs.readdirSync(dir).forEach(f => {
    if (f.substring(0, 4) === 'tmp-') {
      rimraf.sync(`${dir}/${f}`)
      //console.log(f + ' deleted')
    }
  });
  console.log("> Ganache temporary files deleted.");
}

//Checks the package manager used by the SUT
function getPackageManager() {
  let packageManager;

  for (const lockFile of packageManagerGlob) {
    if (fs.existsSync(projectDir + lockFile)) {
      let packageManagerFile = lockFile;
      if (!packageManagerFile) {
        console.error("Target project does not contain a suitable lock file.");
        process.exit(1);
      }
      if (lockFile.includes("yarn")) {
        packageManager = "yarn";
      } else {
        packageManager = "npm";
      }
      break;
    }
  }
  return packageManager;
}

//Checks if SuMo was correctly installed
function version() {
  if (fs.existsSync("./node_modules")) {
    console.log("SuMo V." +package.version)
  }else{
    console.log("SuMo is not installed.")
  }
}

module.exports = {
  cleanSumo: cleanSumo,
  restore: restore,
  cleanTmp: cleanTmp,
  cleanBuildDir: cleanBuildDir,
  getPackageManager: getPackageManager,
  version: version
};
