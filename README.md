# ⚡ Ladder Sim

Simulador de Lógica Ladder (PLC) no navegador, escrito em **JavaScript puro** — sem frameworks, sem build step, sem dependências de runtime. Abre e roda em qualquer navegador moderno.

🔗 **Demo:** https://rafaelf09.github.io/ladder-sim/

> Projeto de portfólio de [@rafaelf09](https://github.com/rafaelf09), estudante de Engenharia Elétrica com ênfase em Sistemas de Potência. Feito para servir tanto como estudo de caso técnico quanto como ferramenta real de treinamento em lógica ladder para profissionais de automação e elétrica.

---

## ✨ Funcionalidades

### Editor e motor de simulação
- Editor visual de diagramas ladder — clique para inserir, duplo clique para renomear tag, botão direito para remover
- Suporte a **branches paralelas** (lógica OR dentro de um rung)
- Scan cycle real (não é só "clique e veja o resultado"): `Start` / `Stop` / `Step`, com velocidade de scan ajustável
- Elementos: Contato NA (`XIC`), Contato NF (`XIO`), Bobina (`OTE`), Bobina Negada, `SET`/`RESET` (latch), Temporizador `TON`, Contador `CTU`
- Import/Export do programa em JSON

### 🔒 Simulação de falha de campo (Force I/O)
Cada tag do painel de I/O pode ser **forçada** (🔒), travando seu valor independente da lógica do programa — exatamente como o recurso de *force* de um CLP real. Isso permite simular cenários de diagnóstico comuns em campo:
- **Contato colado** — força uma entrada em `ON` e observa a lógica reagir como se o botão/sensor estivesse fisicamente travado
- **Bobina/contator queimado** — força uma saída em `OFF` e vê a lógica "tentar" energizar sem sucesso, útil pra treinar raciocínio de troubleshooting

### 📈 Diagrama de tempo (Timing Diagram)
Monitore até 6 tags simultaneamente (ícone 📈 no painel de I/O) e acompanhe a evolução ON/OFF delas ao longo dos últimos scans, como um osciloscópio digital — essencial para entender temporizadores, contadores e condições de corrida entre sinais.

### Exemplos prontos (aplicações reais de automação industrial)
| Exemplo | O que ensina |
|---|---|
| Partida Direta de Motor | Selo (self-holding) e intertravamento básico |
| Partida Estrela-Triângulo | Temporizador `TON` controlando transição de contatores |
| **Reversão de Motor (Intertravado)** | Intertravamento elétrico cruzado entre dois contatores + relé de sobrecarga |
| **Bomba com Boias de Nível** | Controle por histerese (liga/desliga) com dois sensores de nível |
| Semáforo | Máquina de estados temporizada com múltiplos `TON` encadeados |
| Contagem de Peças | Contador `CTU` com reset manual |

---

## 🚀 Como rodar

Não precisa de instalação nem servidor — é só abrir o `index.html`:

```bash
git clone https://github.com/rafaelf09/ladder-sim.git
cd ladder-sim
open index.html          # macOS
# ou: xdg-open index.html (Linux) / start index.html (Windows)
```

Também dá pra servir localmente (recomendado se o navegador reclamar de CORS ao importar/exportar arquivos):

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

---

## 🧭 Como usar

1. Escolha um elemento na barra de ferramentas (NA, NF, Bobina, TON, CTU...) e clique num rung para inserir
2. Dê um nome à tag (ex: `I0.0`, `Q0.0`, `M0.0`) — convenção livre, mas `I*` e `K*/H*/S*/B*` viram entradas interativas no painel lateral automaticamente
3. Clique em **▶ Start** para rodar o scan cycle continuamente, ou **⏭ Step** para avançar um scan por vez
4. No painel de I/O, clique nos botões ON/OFF para simular sensores e botoeiras
5. Use 🔒 para forçar uma tag (simular falha de campo) e 📈 para acompanhar sua evolução no diagrama de tempo
6. Use o menu **Exemplos prontos** para carregar um caso de automação industrial já modelado

---

## 🏗️ Arquitetura

Vanilla JS modularizado por responsabilidade, sem bundler — cada arquivo é um `<script>` clássico carregado na ordem correta pelo `index.html`:

```
ladder-sim/
├── index.html          # estrutura da página e ordem de carregamento dos scripts
├── css/
│   └── style.css       # tema dark, todo o visual do simulador
├── js/
│   ├── engine.js        # State (memória de bits + force), Program, scan cycle, TON/CTU
│   ├── elements.js      # desenho SVG de cada elemento ladder
│   ├── editor.js        # renderização do diagrama e interações do editor
│   ├── trend.js          # diagrama de tempo (histórico de tags monitoradas)
│   ├── examples.js      # biblioteca de programas prontos
│   └── ui.js             # painel de I/O, controles, integração geral
├── test-engine.js       # testes do motor de simulação (scan, force)
└── smoke-test.js        # smoke test da aplicação inteira via jsdom
```

**Por que scripts clássicos e não módulos ES?** Decisão deliberada de portfólio: mostrar que dá pra estruturar um projeto de porte médio em JS sem depender de bundler/framework, mantendo cada peça (motor, editor, UI) desacoplada e testável isoladamente.

### Testes

```bash
npm install   # só instala o jsdom, usado exclusivamente pelo smoke test
npm test
```

- `test-engine.js` valida a lógica pura do motor (scan cycle, force/unforce) sem tocar no DOM
- `smoke-test.js` carrega a aplicação inteira num DOM simulado (jsdom), roda todos os exemplos e as interações principais (inserir elemento, forçar tag, monitorar no trend), garantindo que nenhum erro de runtime passe despercebido antes do deploy

---

## 🛣️ Roadmap

- [ ] Temporizador `TOF` (off-delay) e contador `CTD` (decrescente)
- [ ] Detecção de borda isolada (`OSR`/`OSF`)
- [ ] Validação de programa antes de rodar (bobina duplicada, rung sem saída)
- [ ] Exportar diagrama como imagem/PDF
- [ ] Log de eventos (histórico de mudanças de tag com timestamp)

---

## 📄 Licença

MIT — sinta-se à vontade para usar como referência de estudo ou base para seu próprio simulador.

