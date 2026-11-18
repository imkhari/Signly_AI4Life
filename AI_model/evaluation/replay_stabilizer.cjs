// Replay the actual frontend stabilizer with its current camera options.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const ts = require(path.join(root, 'frontend/node_modules/typescript'));
const source = fs.readFileSync(path.join(root, 'frontend/src/services/vsl/GestureStabilizer.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, { exports: exportsObject });
const clips = JSON.parse(fs.readFileSync(0, 'utf8'));
const results = clips.map(frames => {
  const stabilizer = new exportsObject.GestureStabilizer(exportsObject.CAMERA_STABILIZER_OPTIONS);
  const candidates = [];
  for (const frame of frames) {
    const result = stabilizer.process(frame.prediction, frame.timestamp_ms);
    if (result.candidate) {
      candidates.push({ gloss: result.candidate.gloss, timestamp_ms: frame.timestamp_ms });
    }
  }
  return candidates;
});
process.stdout.write(JSON.stringify({ options: exportsObject.CAMERA_STABILIZER_OPTIONS, clips: results }));
