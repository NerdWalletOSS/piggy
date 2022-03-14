#!/bin/bash
yarn install-patch
yarn forwarder:build
yarn build
yarn package
