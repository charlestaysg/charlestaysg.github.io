// Turns off Evidence's anonymous usage stats (Segment). Runs after every npm install.
// Evidence wipes .evidence/template on each start, so a settings file there does not stick;
// instead, make the package treat a missing setting as "no".
const fs = require('fs');
const file = require.resolve('@evidence-dev/telemetry');
const src = fs.readFileSync(file, 'utf8');
const out = src.replace(/const usageStats = [\s\S]*?;\n/, "const usageStats = 'no';\n");
if (out === src && !src.includes("const usageStats = 'no';")) {
	console.error('telemetry-off: pattern not found in ' + file + ' — check it by hand');
	process.exit(1);
}
fs.writeFileSync(file, out);
console.log('telemetry-off: usage stats disabled in ' + file);
