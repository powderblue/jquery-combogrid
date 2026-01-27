#!/usr/bin/bash

DIR="$(dirname $0)"

"$DIR/lint.sh"

if [ $? -ne 0 ]; then
    exit $?;
fi

MERGED_JS="dist/js/jquery.ui.combogrid.js"
MINIFIED_JS="dist/js/jquery.ui.combogrid.min.js"

# Merge the source files
concat -o "$MERGED_JS" src/cg_zIndex.js src/menucombo.js src/combogrid.js
git add "$MERGED_JS"

# Create a minified version of the JS
uglifyjs "$MERGED_JS" --output "$MINIFIED_JS"
git add "$MINIFIED_JS"

# Create a minified version of the CSS
css-minify -f dist/css/smoothness/jquery.ui.combogrid.css -o dist/css/smoothness/
git add dist/css/smoothness/jquery.ui.combogrid.min.css
