#!/bin/bash
ant clean
ant

echo "===============  start  =============="
cd dist/
unzip *.zip
cd modules/android
cp -rv it.uhopper.mqtt "/Users/linnal/Library/Application Support/Titanium/modules/android/"
echo "===============  done  =============="
