#!/bin/bash

filtered_test=$(grep -rnwl ./tests -e "test.only\|it.only\|describe.only" --include \*.js | tr '\n' ' ')

if [ "$verbose_test" == 'true' ]
then
  npx jest --coverage --runInBand --detectOpenHandles $filtered_test && jest-badge-generator --output './badges'
else
  npx jest --coverage --silent --runInBand --detectOpenHandles $filtered_test && jest-badge-generator --output './badges'
fi