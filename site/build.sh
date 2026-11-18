#!/bin/sh
# Cloudflare Pages 构建：官网放根目录，游戏放 /hero-defense/
set -e
rm -rf dist && mkdir -p dist
cp -r site/. dist/ && rm -f dist/build.sh
cp -r hero-defense dist/hero-defense
rm -rf dist/hero-defense/mobile dist/hero-defense/store
