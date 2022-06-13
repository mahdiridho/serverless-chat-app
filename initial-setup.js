#! /usr/bin/env node

/*!
 * Copyright 2017-2018 Flatmax Pty Ltd
 * You may not retain, use nor modify this file without written consent from
 * Flatmax Pty Ltd.
 */

"use strict";
const fs = require('fs');
const { exit } = require('process');
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function Question(q) {
  return new Promise(function tryPromise(resolve) {
    rl.question(q, answer => {
      if (!answer) {
        console.log("Unknown answer!")
        return tryPromise(resolve)
      }
      return resolve(answer)
    })
  })
}

function intro() {
  console.log("         ..............")
  console.log("       ..              ..           Appycloud.tech")
  console.log("     ..                  ..         --------------")
  console.log("   ..   © appycloud.tech   ..       Let design and deploy serverless apps in elegant way")
  console.log("  ..                        ..")
  console.log(" ::     ----------------     ::     Populate your project info including")
  console.log("  ..                        ..      project name, region, client id, and api id")
  console.log("   ..       ℗ Flatmax      ..")
  console.log("     ..                  ..         Note: Go to your appycloud project - Appy Auth Setting")
  console.log("       ..              ..           to get the info")
  console.log("         ..............\n")  
}

async function oldConfig() {
  if (fs.existsSync('./config-dev.json') && fs.existsSync('./config-prod.json')) {
    let configDev = require('./config-dev.json')
    console.log("Development config already exists")
    console.log(configDev)
    let configProd = require('./config-prod.json')
    console.log("Production config already exists")
    console.log(configProd)
    let createConfig = await Question("\n Do you want to create new config (Y/N)? ")
    if (createConfig.toLowerCase() == "y") {
      describe()
    } else {
      process.exit()
    }
  } else {
    describe()
  }
}

async function describe() {
  console.log(" Setup production env")
  console.log("\n --------------------")
  let projectProd = await Question("\n What is the project name running in? ")
  let regionProd = await Question("\n Which region is the project running in? ")
  let clientIdProd = await Question("\n What is the project client id? ")
  let apiIdProd = await Question("\n What is the project api id? ")
  console.log("\n\n Setup development env")
  console.log("\n --------------------")
  let projectDev = await Question("\n What is the project name running in? ")
  let regionDev = await Question("\n Which region is the project running in? ")
  let clientIdDev = await Question("\n What is the project client id? ")
  let apiIdDev = await Question("\n What is the project api id? ")
  rl.close();

  let configProd = JSON.stringify({
    "prefix": projectProd, 
    "region": regionProd,
    "clientId": clientIdProd,
    "apiId": apiIdProd
  })
  let configDev = JSON.stringify({
    "prefix": projectDev, 
    "region": regionDev,
    "clientId": clientIdDev,
    "apiId": apiIdDev
  })

  console.log("\n Production config : "+ configProd);
  console.log("\n Development config : "+ configDev);
  console.log("\n Done\n");
  fs.writeFileSync('./config-prod.json', configProd);
  fs.writeFileSync('./config-dev.json', configDev);
}
intro()
oldConfig()