const fs = require('fs');
const path = require('path');

function preparePackage(pkgDir = process.cwd()) {
    const rootPkgPath = path.join(pkgDir, 'package.json');
    if (!fs.existsSync(rootPkgPath)) {
        console.error('No package.json found in ' + pkgDir);
        process.exit(1);
    }

    const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
    const buildDir = path.join(pkgDir, 'build');

    if (!fs.existsSync(buildDir)) {
        console.error('Build directory does not exist: ' + buildDir);
        process.exit(1);
    }

    const pubPkg = { ...rootPkg };

    delete pubPkg.devDependencies;
    delete pubPkg.scripts;
    delete pubPkg.files;

    const stripBuild = (str) => {
        if (!str || typeof str !== 'string') return str;
        return str.replace(/^(\.\/)?build\//, './');
    };

    if (pubPkg.main) pubPkg.main = stripBuild(pubPkg.main).replace(/^\.\//, '');
    if (pubPkg.types) pubPkg.types = stripBuild(pubPkg.types).replace(/^\.\//, '');
    if (pubPkg.bin) {
        if (typeof pubPkg.bin === 'string') {
            pubPkg.bin = stripBuild(pubPkg.bin).replace(/^\.\//, "");
        } else if (typeof pubPkg.bin === 'object') {
            const newBin = {};
            for (const [k, v] of Object.entries(pubPkg.bin)) {
                newBin[k] = stripBuild(v).replace(/^\.\//, "");
            }
            pubPkg.bin = newBin;
        }
    }

    if (pubPkg.exports) {
        const rewriteExports = (obj) => {
            if (typeof obj === 'string') return stripBuild(obj);
            if (Array.isArray(obj)) return obj.map(rewriteExports);
            if (typeof obj === "object" && obj !== null) {
                const res = {};
                for (const [k, v] of Object.entries(obj)) {
                    res[k] = rewriteExports(v);
                }
                return res;
            }
            return obj;
        };
        pubPkg.exports = rewriteExports(pubPkg.exports);
    }

    fs.writeFileSync(path.join(buildDir, 'package.json'), JSON.stringify(pubPkg, null, 2) + '\n');

    function patchDualExports(dir) {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        for (const f of files) {
            const fullPath = path.join(dir, f.name);
            if (f.isDirectory()) {
                patchDualExports(fullPath);
            } else if (f.name.endsWith('.js') && !f.name.endsWith('.d.ts')) {
                let content = fs.readFileSync(fullPath, 'utf8');
                if (content.includes('exports.default =') && !content.includes('module.exports = exports.default')) {
                    content += '\nif (exports.default) {\n    const d = exports.default;\n    module.exports = d;\n    Object.assign(module.exports, exports);\n    module.exports.default = d;\n}\n';
                    fs.writeFileSync(fullPath, content, 'utf8');
                }
            }
        }
    }
    patchDualExports(buildDir);


    const copyIfExists = (file) => {
        const src = path.join(pkgDir, file);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, path.join(buildDir, file));
        }
    };

    copyIfExists('README.md');
    copyIfExists('LICENSE.md');
    copyIfExists('LICENSE');

    console.log(`[build] Successfully prepared ${pubPkg.name}@${pubPkg.version} inside build/`);
}

preparePackage();
