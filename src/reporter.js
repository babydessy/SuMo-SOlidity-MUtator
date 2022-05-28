const chalk = require('chalk')
const fs = require('fs')
const config = require('./config')
const aliveDir = config.aliveDir
const killedDir = config.killedDir

function Reporter() {
  this.survived = [];
  this.killed = [];
  this.stillborn = [];
  this.equivalent = [];
  this.redundant = [];
  this.timedout = [];
}


Reporter.prototype.chalkMutant = function(mutant) {
  return chalk.rgb(186,85,211)(mutant.hash());
}

Reporter.prototype.beginMutationTesting = function( mutations) {
  console.log("=====================================");
  console.log(chalk.yellow.bold("👾 Starting Mutation Testing 👾"))
  console.log("=====================================");
};

Reporter.prototype.beginTest = function(mutant) {

  console.log("Mutant successfully compiled.");

  console.log("Applying mutation " +  this.chalkMutant(mutant) + " to " + mutant.file);
  process.stdout.write(mutant.diff());
  console.log("\n ");
  console.log(chalk.yellow("Running tests ") + "for mutation " + this.chalkMutant(mutant));
};

Reporter.prototype.beginCompile = function(mutant) {
  console.log("\n ");
  console.log("\n " + chalk.yellow("Compiling mutation ") +  this.chalkMutant(mutant) + " of " + mutant.file);
};

//Set the status of a mutant
Reporter.prototype.mutantStatus = function (mutant) {
  switch (mutant.status) {
    case "killed":
      this.killed.push(mutant);
      console.log("Mutant " + this.chalkMutant(mutant) + " was killed by tests.");
      fs.writeFileSync(killedDir + "/mutant-" + mutant.hash() + ".sol", mutant.printMutation(), function(err) {
        if (err) return console.log(err);
      });
      break;
    case "live":
      this.survived.push(mutant);
      console.log("Mutant " + this.chalkMutant(mutant) + " survived testing.");
      fs.writeFileSync(aliveDir + "/mutant-" + mutant.hash() + ".sol", mutant.printMutation(), function(err) {
        if (err) return console.log(err);
      });
      break;
    case "stillborn":
      this.stillborn.push(mutant);
      console.log("Mutant " + this.chalkMutant(mutant) + " is stillborn.");
      break;
    case "equivalent":
      this.equivalent.push(mutant);
      console.log(
        "Mutant " + this.chalkMutant(mutant) + " is equivalent."
      );
      break;
    case "timedout":
      this.timedout.push(mutant);
      console.log(
        "Mutant " + this.chalkMutant(mutant) + " has timed out."
      );
      break;
    case "redundant":
      this.redundant.push(mutant);
      console.log(
        "Mutant " + this.chalkMutant(mutant) + " is redundant."
      );
      break;
  }
};

//Prints preflight summary to console
Reporter.prototype.preflightSummary = function(mutations) {
  console.log("---------------------------------");
  console.log(chalk.yellow.bold("Preflight: ") + mutations.length + " mutation(s) found. ");
  console.log("--------------------------------");

  for (const mutation of mutations) {
    console.log(mutation.file + ":" + mutation.hash() + ":");
    process.stdout.write(mutation.diff());
  }
};


//Prints test summary to console
Reporter.prototype.testSummary = function () {
  console.log('\n')
  console.log('==============')
  console.log(chalk.yellow.bold("Test Summary"))
  console.log('==============')
  console.log(
    "• " + this.survived.length +
    " mutants survived testing.\n" +
    "• " + this.killed.length +
    " mutants killed.\n" +
    "• " + this.stillborn.length +
    " mutants stillborn.\n" +
    "• " + this.equivalent.length +
    " mutants equivalent.\n",
    "• " + this.redundant.length +
    " mutants redundant.\n",
    "• " + this.timedout.length +
    " mutants timed-out.\n"
  );
  if (this.survived.length > 0) {
    console.log(
      "Live: " + this.survived.map(m => this.chalkMutant(m)).join(", ")
    );
  }
};

//Setup test report
Reporter.prototype.setupReport = function(mutationsLength, generationTime) { 
  fs.writeFileSync(".sumo/report.txt", "################################################ REPORT ################################################\n\n------------------------------------------- GENERATED MUTANTS ------------------------------------------ \n", function (err) {
    if (err) return console.log(err);
  }) 
}

//Save generated mutations to report
Reporter.prototype.saveGeneratedMutants = function(fileString, mutantString) {
  
  fs.appendFileSync(".sumo/report.txt", fileString + mutantString, {'flags': 'a'}, function (err) {
    if (err) return console.log(err);
  })  
}

//Save mutants generation time to report
Reporter.prototype.saveGenerationTime = function(mutationsLength, generationTime) { 
  fs.appendFileSync(".sumo/report.txt", "\n"+ mutationsLength + " mutant(s) found in " +generationTime+ " seconds. \n", function (err) {
    if (err) return console.log(err);
  }) 
}

//Save test results to report
Reporter.prototype.printTestReport = function(time) {
  const validMutants = this.survived.length + this.killed.length;
  const stillbornMutants = this.stillborn.length;
  const equivalentMutants = this.equivalent.length;
  const redundantMutants = this.redundant.length;
  const timedoutMutants = this.timedout.length;
  const totalMutants = validMutants + stillbornMutants + timedoutMutants + equivalentMutants + redundantMutants;
  const mutationScore = ((this.killed.length / validMutants) * 100).toFixed(2);
  var printString = "\n ---------------------- TEST REPORT --------------------- \n\n  "
    + totalMutants + " mutant(s) tested in " + time + " minutes."
    + "\n\n - Total mutants: " + totalMutants
    + "\n\n - Valid mutants: " + validMutants;


  printString = printString + "\n\n - Live mutants: " + this.survived.length;
  if (this.survived.length > 0)
    printString = printString + "\n --- Live: " + JSON.stringify(this.survived.map(m => m.hash()).join(", "));

  printString = printString + "\n\n - Killed mutants: " + this.killed.length;
  if (this.killed.length > 0)
    printString = printString + "\n --- Killed: " + JSON.stringify(this.killed.map(m => m.hash()).join(", "));

  printString = printString + "\n\n - Equivalent mutants: " + this.equivalent.length;
  if (this.equivalent.length > 0)
    printString = printString + "\n --- Equivalent: " + JSON.stringify(this.equivalent.map(m => m.hash()).join(", "));

  printString = printString + "\n\n - Redundant mutants: " + this.redundant.length;
  if (this.redundant.length > 0)
    printString = printString + "\n --- Redundant: " + JSON.stringify(this.redundant.map(m => m.hash()).join(", "));

  printString = printString + "\n\n - Stillborn mutants: " + this.stillborn.length;
  if (this.stillborn.length > 0)
    printString = printString + "\n --- Stillborn: " + JSON.stringify(this.stillborn.map(m => m.hash()).join(", "));

  printString = printString + "\n\n - Timed-Out mutants: " + this.timedout.length;
  if (this.timedout.length > 0)
    printString = printString + "\n --- Timed-Out: " + JSON.stringify(this.timedout.map(m => m.hash()).join(", "));

  printString = printString + "\n\n Mutation Score = " + mutationScore;

  fs.appendFileSync(".sumo/report.txt", printString, { "flags": "a" }, function(err) {
    if (err) return console.log(err);
  });
};



module.exports = Reporter
