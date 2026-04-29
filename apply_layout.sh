#!/usr/bin/env bash

set -euo pipefail

layout_file="layout.html"

shopt -s nullglob globstar

for page_file in src/**/*.html; do
	body_content=$(perl -0ne 'if (/<main[^>]*>.*?<\/main>/s) { print $& }' "$page_file")
	BODY_CONTENT="$body_content" perl -0pe 'my $main = $ENV{BODY_CONTENT}; s/<slot\s*\/>/$main/s' "$layout_file" > "$page_file"
done
