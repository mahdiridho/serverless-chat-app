#!/bin/bash

# is the answer match to the option list
function checkOption {
  local foundItem=false
  for o in $2; do
    if [ "$o" == "$1" ]; then
      foundItem=true
      break
    fi
  done
  echo $foundItem
}

# question the user for a choice
# \param $1 the env variable to set on success
# \param $2 the question to ask
# \param $3 the list of options
# \param $4 the default answer if provided
# \returns env var $1 is set to the user's answer
function Question {
  whichVal=''
  while [ -z "$whichVal" ]; do
    for p in $3; do
      echo $p
    done

  	echo
  	echo $2
  	read result

    whichVal=`echo $3 | grep "$result"`
  done
  local answer=$1
  if [ "$result" != '' ]; then
    # matching the answer to the option list
    option=$(checkOption "$result" "$3")
    if $option; then
      eval $answer="'$result'"
    else
      Question "$1" "$2" "$3" "$4"
      return
    fi
  else
    # if 4th arg exists, set is as the default answer
    # otherwise loop the question
    if [ "$4" != '' ]; then
      eval $answer="'$4'"
    else
      Question "$1" "$2" "$3"
      return
    fi
  fi
  echo
}

# does aws credential profile file exist?
if [ ! -f ~/.aws/credentials ]; then
  echo "The AWS credentials file (~/.aws/credentials) doesn't exist!"
  echo "Setup your credentials file for the AWS cli command : https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html"
  exit
fi

echo Setting up your profile
profiles=`aws configure list-profiles`
Question profile "Which AWS profile is the system under (or leave empty for default profile)?" "$profiles" "default"

branch=$(git branch | sed -n -e 's/^\* \(.*\)/\1/p')
bucket='dev.chat.app'
if [ $branch == 'master' ]; then
  bucket='prod.chat.app'
fi

npm run build
cd build

aws --profile $profile s3 sync . s3://$bucket --delete --sse AES256 --cache-control no-cache
aws --profile $profile s3 cp s3://$bucket/ s3://$bucket/ --exclude "*" --include "/src/config.json" --metadata-directive REPLACE --sse AES256 --cache-control max-age=604800 --content-type application/json
aws --profile $profile s3 cp s3://$bucket/ s3://$bucket/ --exclude "*" --include "*.js" --exclude "pwabuilder-sw.js" --recursive --metadata-directive REPLACE --sse AES256 --cache-control max-age=604800 --content-type application/javascript