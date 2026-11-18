#!/bin/sh
# vantaxgame.com（万泰游戏 Vantax 总站）构建：根目录是总站首页，每个游戏放在 /<游戏目录>/
set -e
rm -rf dist && mkdir -p dist
cp -r vantax/. dist/ && rm -f dist/build.sh dist/BRIEF_GROK.md
# 游戏：每个游戏发布一份到总站（新增游戏就在这里加一行）
cp -r hero-defense dist/hero-defense && rm -rf dist/hero-defense/mobile dist/hero-defense/store
