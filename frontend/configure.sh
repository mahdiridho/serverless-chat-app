#!/bin/bash

branch=$(git branch | sed -n -e 's/^\* \(.*\)/\1/p')
config='config-dev.json'
if [ $branch == 'master' ]; then
  config='config-prod.json'
fi

cp ../${config} ./src/config.json