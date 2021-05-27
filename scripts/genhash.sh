#!/bin/bash

echo sha384-$(cat $1 | openssl dgst -sha384 -binary | base64);     
