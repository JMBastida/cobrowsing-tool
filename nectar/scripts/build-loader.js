const fs = require('fs');
const uglify = require('uglify-js');
const path = require('path');

// 1. Calculamos la raíz del proyecto (igual que antes)
const projectRoot = path.resolve(__dirname, '../');

// 2. Rutas absolutas
const inputFile = path.join(projectRoot, 'scripts', 'accounts', 'installation-script.js');
const outFile = path.join(projectRoot, 'scripts', 'accounts', 'installation-script-ugly.js');

console.log("📂 Input:", inputFile);

// 3. Leemos el archivo
try {
    const code = fs.readFileSync(inputFile, 'utf8');

    // 4. Configuramos Uglify
    // NOTA: He quitado 'wrap' porque para un script de carga que se ejecuta solo,
    // suele estorbar más que ayudar. Si lo necesitas estrictamente, descoméntalo.
    const options = {
        toplevel: true,
        compress: true,
        mangle: true,
        output: {
            annotations: false // eq. a --no-annotations
        }
        // wrap: 'Sideby' // <-- Descomenta si REALMENTE necesitas encapsularlo en la variable Sideby
    };

    const result = uglify.minify(code, options);

    if (result.error) {
        throw new Error(result.error);
    }

    // 5. Escribimos el resultado
    fs.writeFileSync(outFile, result.code);
    console.log("✅ Loader minificado creado en:", outFile);
    console.log("📄 Contenido:", result.code);

} catch (err) {
    console.error("❌ Error:", err.message);
}