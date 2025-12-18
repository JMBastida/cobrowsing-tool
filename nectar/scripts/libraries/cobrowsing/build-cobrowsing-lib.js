const fs = require('fs');
const uglify = require('uglify-js');
const Browserify = require('browserify');
const path = require('path');

// 1. Definimos la RAÍZ del proyecto calculándola desde la ubicación de este script
// __dirname es: .../nectar/scripts/libraries/cobrowsing
// Subimos 3 niveles (../../..) para llegar a la raíz: .../nectar
const projectRoot = path.resolve(__dirname, '../../../');

// 2. Definimos las rutas ABSOLUTAS usando la raíz del proyecto
const inputFile = path.join(projectRoot, 'libraries', 'cobrowsing', 'index.js');
const outDir = path.join(projectRoot, 'dist', 'cobrowsing');
const outFile = path.join(outDir, 'lib.js');
const tempFile = path.join(projectRoot, 'temp_cobrowsing_bundle.js');

console.log("📂 Input:", inputFile);
console.log("📂 Output:", outFile);

// Verificación previa: ¿Existe el archivo de entrada?
if (!fs.existsSync(inputFile)) {
    console.error(`❌ Error Crítico: No se encuentra el archivo de entrada en:\n${inputFile}`);
    process.exit(1);
}

const browserify = Browserify(inputFile, { standalone: 'sideby' });

browserify.bundle((err, src) => {
    if (err) {
        console.error("❌ Error creando el bundle de Browserify:");
        console.error(err.message);
        process.exit(1);
    }

    try {
        // Escribimos temporal
        fs.writeFileSync(tempFile, src);

        // Leemos y Minificamos
        const data = fs.readFileSync(tempFile, { encoding: 'utf-8' });
        const result = uglify.minify(data);

        if (result.error) {
            throw new Error(`UglifyJS Error: ${result.error.message}`);
        }

        // Aseguramos que el directorio de salida existe
        if (!fs.existsSync(outDir)){
            fs.mkdirSync(outDir, { recursive: true });
        }

        // Escribimos final
        fs.writeFileSync(outFile, result.code);

        // Limpieza
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
        }

        console.log("✅ Build completado con éxito.");

    } catch (ioErr) {
        console.error("❌ Error manipulando archivos:", ioErr.message);
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        process.exit(1);
    }
});