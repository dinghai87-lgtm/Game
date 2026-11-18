#!/bin/sh
set -e
rm -rf dist && mkdir -p dist
cp -r site/. dist/ && rm -f dist/build.sh dist/BRIEF_GROK.md
cp -r hero-defense dist/hero-defense
rm -rf dist/hero-defense/mobile dist/hero-defense/store
