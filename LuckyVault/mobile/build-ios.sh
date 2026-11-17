#!/bin/bash
# iOS App Store build — run on a Mac with Xcode installed and signed in to your Apple Developer account.
# Usage: ./build-ios.sh https://your-domain.com
set -e
cd "$(dirname "$0")"
[ -z "$1" ] && { echo "Usage: ./build-ios.sh https://your-domain.com"; exit 1; }
case "$1" in https://*) ;; *) echo "The store build must use an https:// server address"; exit 1;; esac
npm install
node prepare.js "$1"
[ -d ios ] || npx cap add ios
npx cap sync ios
node icons.js || true
echo
echo "Xcode will open. In Xcode: select 'App' target → Signing & Capabilities → choose your Team,"
echo "add the 'In-App Purchase' capability, then Product → Archive → Distribute App → App Store Connect."
npx cap open ios
