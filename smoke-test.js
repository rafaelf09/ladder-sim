const path = require('path');
const { JSDOM } = require('jsdom');

(async () => {
  const dom = await JSDOM.fromFile(path.join(__dirname, 'index.html'), {
    runScripts: 'dangerously',
    resources: 'usable'
  });

  const { window } = dom;
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  await wait(500); // deixa DOMContentLoaded e scripts rodarem

  const errors = [];
  window.addEventListener('error', (e) => errors.push(e.error?.stack || e.message));

  // 1. Carrega cada exemplo e roda alguns scans manuais
  const ids = window.LadderExamples.list.map(e => e.id);
  for (const id of ids) {
    window.LadderExamples.load(id);
    for (let i = 0; i < 3; i++) window.LadderEngine.scanCycle();
    window.LadderEditor.render();
    window.UI.updateIOPanel();
  }
  console.log('✅ Todos os exemplos carregaram e renderizaram sem erro:', ids.join(', '));

  // 2. Testa inserção de elemento manualmente (bug histórico)
  window.LadderEngine.Program.clear();
  window.LadderEngine.Program.addRung([]);
  window.LadderEngine.Program.insertElement(0, 0, 0, { type: 'NO', tag: 'TESTE' });
  window.LadderEditor.render();
  console.log('✅ Inserção manual de elemento renderizou sem erro');

  // 3. Testa force + trend juntos
  window.LadderExamples.load('partida-direta');
  window.UI.toggleWatch('S1');
  window.UI.toggleWatch('KM1');
  window.UI.toggleForce('KM1');
  window.UI.toggleInput('S1');
  window.LadderEngine.scanCycle();
  window.LadderTrend.sample();
  console.log('✅ Force + trend funcionaram juntos sem erro. KM1 forçado?', window.LadderEngine.State.isForced('KM1'));
  console.log('✅ Trend history KM1:', window.LadderTrend.history['KM1']);

  if (errors.length) {
    console.error('❌ ERROS CAPTURADOS:', errors);
    process.exit(1);
  } else {
    console.log('\n🎉 SMOKE TEST PASSOU — nenhum erro de runtime.');
  }
  process.exit(0);
})();

