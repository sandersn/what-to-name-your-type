const ts = require('typescript')
const fs = require('fs')
const path = require('path')

const types = new Map()
let i = 0
const pr = ts.createPrinter({ removeComments: true })
for (const dir of fs.readdirSync('../../DefinitelyTyped/types')) {
    const files = fs.readdirSync(path.join('../../DefinitelyTyped/types', dir)).
        filter(f => f.endsWith('.ts')).
        map(f => path.join('../../DefinitelyTyped/types', dir, f))
    for (const src of ts.createProgram(files, {}).getSourceFiles()) {
        if (src.fileName.match(/node_modules/)) continue

        /** @param {ts.Node} node @return {void} */
        const walker = node => {
            if (ts.isTypeNode(node)) {
                const s = pr.printNode(ts.EmitHint.Unspecified, node, src).replace(/[\n ]+/g, ' ')
                types.set(s, (types.get(s) || 0) + 1)
            }
            else {
                return ts.forEachChild(node, walker)
            }
        }
        walker(src)
    }
    i++
    process.stderr.write(i % 100 === 0 ? ('\n'+types.size) : '.')
}
console.log("{")
console.log(Array.from(types)
            .sort(([_x, i], [_y, j]) => j- i)
            .map(([k,v]) => "  " + JSON.stringify(k) + ": " + v)
            .join(",\n"))
console.log("}")
