#!/bin/bash
# push to current branch

CURRENT_BRANCH=`git symbolic-ref --short -q HEAD`

if [ $CURRENT_BRANCH == 'master' ]
then
  echo 'Do not push to master directly!'
  exit 1
fi

git add . && git commit -m 'update'
git status

git push origin $CURRENT_BRANCH