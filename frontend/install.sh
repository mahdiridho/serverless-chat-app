#!/usr/bin/env bash

echo ======
echo deleting old packages
rm -rf node_modules package-lock.json
echo
echo installing the packages
npm i
pwd
echo ======
echo
