# nectar

## Compilar librería integrada en la web del cliente:

node scripts/libraries/cobrowsing/build-cobrowsing-lib.js

## Compilar librería integrada en un iframe de la web del cliente:

node scripts/libraries/cobrowsing-iframe/build-cobrowsing-iframe-lib.js

## Uglify client script

uglifyjs --compress --mangle --no-annotations --toplevel --wrap Sideby -- ./scripts/accounts/installation-script.js -o ./scripts/accounts/installation-script-ugly.js

Then, copy the result in installation-script-ugly.js to installation-script.html inside the script tag