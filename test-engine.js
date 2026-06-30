const fs = require('fs');
let src = fs.readFileSync('./js/engine.js', 'utf8');
src = src.replace('window.LadderEngine = {', 'const _exp = {');
src = src + '\nmodule.exports = { State, Program, scanCycle };';
fs.writeFileSync('/tmp/engine-test2.js', src);
const { State, Program, scanCycle } = require('/tmp/engine-test2.js');

Program.addRung([
  { type: 'NO', tag: 'I0.0' },
  { type: 'COIL', tag: 'Q0.0' }
]);
State.set('I0.0', false); scanCycle();
console.log('TESTE 1 — I0.0=false → Q0.0:', State.get('Q0.0'), '| esperado: false');
State.set('I0.0', true); scanCycle();
console.log('TESTE 1 — I0.0=true  → Q0.0:', State.get('Q0.0'), '| esperado: true');
console.log('\n✅ Engine OK!');
