#!/usr/bin/env bash

set -euo pipefail

layout_file="layout.html"

shopt -s nullglob globstar

for page_file in src/**/*.html; do
	body_content=$(perl -0ne 'if (/<main[^>]*>.*?<\/main>/s) { print $& }' "$page_file")

	root=""
	relative=$(dirname "${page_file#src/}")
	if [ "$relative" != "." ]; then
		for segment in $(echo "$relative" | tr '/' ' '); do
			root="${root}../"
		done
	fi

	ROOT="$root" BODY_CONTENT="$body_content" perl -0777 -pe 'my $root = $ENV{ROOT} // ""; my $main = $ENV{BODY_CONTENT} // ""; s/%ROOT%/$root/g; s/<slot\s*\/\>/$main/s' "$layout_file" > "$page_file"
done
