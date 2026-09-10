const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const root = path.resolve(__dirname);
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.d.ts']);
const printer = ts.createPrinter({ removeComments: true });
let filesProcessed = 0;
let filesSkipped = 0;
function stripCssComments(text) {
    return text.replace(/\/\*[\s\S]*?\*\//g, '');
}
function processFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const original = fs.readFileSync(filePath, 'utf8');
    let modified = original;
    if (ext === '.css' || ext === '.scss') {
        modified = stripCssComments(original);
    }
    else {
        const scriptKind = ext === '.tsx' ? ts.ScriptKind.TSX : ext === '.jsx' ? ts.ScriptKind.JSX : ts.ScriptKind.TS;
        const sourceFile = ts.createSourceFile(filePath, original, ts.ScriptTarget.ESNext, true, scriptKind);
        modified = printer.printFile(sourceFile);
    }
    if (modified !== original) {
        fs.writeFileSync(filePath, modified, 'utf8');
        filesProcessed += 1;
    }
    else {
        filesSkipped += 1;
    }
}
function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'out') {
            continue;
        }
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(entryPath);
        }
        else if (extensions.has(path.extname(entry.name).toLowerCase())) {
            processFile(entryPath);
        }
    }
}
walk(root);
console.log(`Processed ${filesProcessed} modified file(s), skipped ${filesSkipped} unchanged file(s).`);
