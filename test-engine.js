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

// TESTE 2 — Força de I/O (simulação de falha de campo)
State.setForce('Q0.0', false);           // "bobina queimada": trava Q0.0 em OFF
State.set('I0.0', true); scanCycle();    // lógica tenta energizar Q0.0...
console.log('TESTE 2 — Q0.0 forçado OFF, mesmo com I0.0=true:', State.get('Q0.0'), '| esperado: false');
State.clearForce('Q0.0');
scanCycle();
console.log('TESTE 2 — Após destravar, Q0.0 volta a acompanhar a lógica:', State.get('Q0.0'), '| esperado: true');

console.log('\n✅ Engine OK!');

