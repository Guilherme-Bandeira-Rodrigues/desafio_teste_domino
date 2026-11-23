"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { conjunto, Partida } = require("../src/domino");
const chave = (p) => [...p].sort((a, b) => a - b).join(",");
function rng(seed) {
  return () => ((seed = (seed * 48271) % 2147483647) - 1) / 2147483646;
}
function estado(j) {
  return JSON.stringify({
    vez: j.vez,
    maos: j.maos,
    monte: j.monte,
    mesa: j.mesa,
    motivo: j.motivo,
    vencedor: j.vencedor,
    pontos: j.pontos,
  });
}
for (const valor of [-1, 1, NaN, Infinity, "0", null])
  test(`distribuição rejeita valor inválido de rng: ${String(valor)}`, () =>
    assert.throws(() => new Partida({ rng: () => valor })));
test("contrato: conjunto completo, sem equivalentes invertidos ou valores fora de 0..6", () => {
  const p = conjunto();
  assert.equal(p.length, 28);
  assert.equal(new Set(p.map(chave)).size, 28);
  assert.ok(
    p.every((x) => x.length === 2 && x[0] >= 0 && x[0] <= x[1] && x[1] <= 6),
  );
});
for (const seed of [1, 2, 3, 31, 97, 2026])
  test(`distribuição ${seed}: 7 peças por mão e 14 no monte, sem perdas`, () => {
    const j = new Partida({ rng: rng(seed) });
    assert.deepEqual(
      j.maos.map((x) => x.length),
      [7, 7],
    );
    assert.equal(j.monte.length, 14);
    const todos = [...j.maos.flat(), ...j.monte].map(chave);
    assert.equal(new Set(todos).size, 28);
    assert.deepEqual([...todos].sort(), conjunto().map(chave).sort());
  });
test("mesma sequência aleatória produz a mesma distribuição", () => {
  assert.equal(
    estado(new Partida({ rng: rng(4) })),
    estado(new Partida({ rng: rng(4) })),
  );
});
for (const valor of [0, 1, 2, 3, 4, 5, 6])
  test(`dupla ${valor}-${valor} inicia quando é a maior`, () => {
    const outras = conjunto()
      .filter((p) => p[0] !== p[1] && !p.includes(valor))
      .slice(0, 2);
    const j = new Partida({
      maos: [[[valor, valor], outras[0]], [outras[1]]],
      monte: [],
    });
    assert.equal(j.vez, 0);
    assert.deepEqual(j.inicial, [valor, valor]);
  });
test("dupla tem prioridade sobre peça de soma maior", () => {
  const j = new Partida({ maos: [[[1, 1]], [[5, 6]]], monte: [] });
  assert.equal(j.vez, 0);
  assert.deepEqual(j.inicial, [1, 1]);
});
test("a maior dupla de ambas as mãos determina a abertura", () => {
  const j = new Partida({
    maos: [
      [
        [2, 2],
        [0, 1],
      ],
      [
        [6, 6],
        [1, 3],
      ],
    ],
    monte: [],
  });
  assert.equal(j.vez, 1);
  assert.deepEqual(j.inicial, [6, 6]);
});
test("sem duplas, desempata soma pelo lado maior", () => {
  const j = new Partida({ maos: [[[3, 4]], [[1, 6]]], monte: [] });
  assert.equal(j.vez, 1);
  assert.deepEqual(j.inicial, [1, 6]);
});
for (const p of [null, [], [1], [1, 2, 3], [-1, 2], [2, 7], [1.2, 3], ["1", 2]])
  test(`rejeita peça inválida ${JSON.stringify(p)}`, () =>
    assert.throws(() => new Partida({ maos: [[p], [[0, 0]]], monte: [] })));
test("rejeita duplicatas entre mãos e monte sem depender da orientação", () => {
  assert.throws(
    () => new Partida({ maos: [[[1, 2]], [[3, 4]]], monte: [[2, 1]] }),
  );
  assert.throws(
    () =>
      new Partida({
        maos: [[[1, 2]], [[3, 4]]],
        monte: [
          [5, 6],
          [6, 5],
        ],
      }),
  );
});
test("se monte é omitido, ele contém as peças não distribuídas", () => {
  const j = new Partida({ maos: [[[6, 6]], [[0, 1]]] });
  assert.equal(j.monte.length, 26);
  assert.equal(
    j.monte.some((p) => ["6,6", "0,1"].includes(chave(p))),
    false,
  );
});
test("primeira jogada errada e jogar fora da vez não alteram estado", () => {
  const j = new Partida({
    maos: [
      [
        [6, 6],
        [1, 6],
      ],
      [[0, 1]],
    ],
    monte: [],
  });
  const antes = estado(j);
  assert.throws(() => j.jogar(1, [0, 1]));
  assert.equal(estado(j), antes);
  assert.throws(() => j.jogar(0, [1, 6]));
  assert.equal(estado(j), antes);
});
test("peça invertida da mão pode ser usada e mesa é orientada à esquerda e à direita", () => {
  const j = new Partida({
    maos: [
      [
        [6, 6],
        [1, 6],
        [2, 1],
      ],
      [
        [3, 6],
        [3, 4],
      ],
    ],
    monte: [],
  });
  j.jogar(0, [6, 6]);
  j.jogar(1, [6, 3], "esquerda");
  j.jogar(0, [6, 1], "direita");
  assert.deepEqual(j.mesa, [
    [3, 6],
    [6, 6],
    [6, 1],
  ]);
  j.jogar(1, [4, 3], "esquerda");
  assert.deepEqual(j.mesa, [
    [4, 3],
    [3, 6],
    [6, 6],
    [6, 1],
  ]);
  assert.equal(j.vencedor, 1);
  assert.equal(j.pontos, 3);
  assert.equal(j.motivo, "batida");
});
test("compra é obrigatória e sequencial até aparecer peça jogável", () => {
  const j = new Partida({
    maos: [
      [
        [6, 6],
        [4, 5],
      ],
      [[0, 1]],
    ],
    monte: [
      [2, 3],
      [1, 6],
    ],
  });
  j.jogar(0, [6, 6]);
  assert.throws(() => j.passar(1));
  assert.deepEqual(j.comprar(1), [2, 3]);
  assert.equal(j.vez, 1);
  assert.deepEqual(j.comprar(1), [1, 6]);
  assert.throws(() => j.comprar(1));
  assert.throws(() => j.passar(1));
  j.jogar(1, [1, 6], "direita");
  assert.equal(j.vez, 0);
});
test("é proibido comprar quando se possui jogada, mesmo com monte disponível", () => {
  const j = new Partida({
    maos: [
      [
        [6, 6],
        [0, 1],
      ],
      [
        [1, 6],
        [2, 3],
      ],
    ],
    monte: [[4, 5]],
  });
  j.jogar(0, [6, 6]);
  const antes = estado(j);
  assert.throws(() => j.comprar(1));
  assert.equal(estado(j), antes);
});
test("sem jogada e com monte vazio passa para adversário com jogada", () => {
  const j = new Partida({
    maos: [
      [
        [6, 6],
        [2, 6],
      ],
      [[0, 1]],
    ],
    monte: [],
  });
  j.jogar(0, [6, 6]);
  j.passar(1);
  assert.equal(j.vez, 0);
  assert.equal(j.motivo, null);
});
test("opções listam cada ponta possível com cópias das peças", () => {
  const j = new Partida({
    maos: [
      [
        [6, 6],
        [0, 1],
      ],
      [
        [1, 6],
        [2, 6],
        [0, 4],
      ],
    ],
    monte: [],
  });
  j.jogar(0, [6, 6]);
  const op = j.opcoes(1);
  assert.deepEqual(op, [
    { peca: [1, 6], lado: "esquerda" },
    { peca: [1, 6], lado: "direita" },
    { peca: [2, 6], lado: "esquerda" },
    { peca: [2, 6], lado: "direita" },
  ]);
  op[0].peca[0] = 99;
  assert.deepEqual(j.maos[1][0], [1, 6]);
});
test("lado pode ser omitido quando há uma única ponta compatível", () => {
  const j = new Partida({
    maos: [
      [
        [6, 6],
        [1, 6],
      ],
      [
        [2, 6],
        [2, 3],
      ],
    ],
    monte: [],
  });
  j.jogar(0, [6, 6]);
  j.jogar(1, [2, 6], "esquerda");
  j.jogar(0, [1, 6]);
  assert.deepEqual(j.mesa, [
    [2, 6],
    [6, 6],
    [6, 1],
  ]);
});
test("se nenhum jogador pode jogar, menor soma vence; empate não pontua", () => {
  for (const [maos, esperado, pontos] of [
    [
      [
        [
          [6, 6],
          [0, 1],
        ],
        [[2, 3]],
      ],
      0,
      5,
    ],
    [
      [
        [
          [6, 6],
          [0, 5],
        ],
        [[1, 4]],
      ],
      null,
      0,
    ],
    [
      [
        [
          [6, 6],
          [4, 5],
        ],
        [[0, 1]],
      ],
      1,
      9,
    ],
  ]) {
    const j = new Partida({ maos, monte: [] });
    j.jogar(0, [6, 6]);
    j.passar(1);
    assert.equal(j.motivo, "trancada");
    assert.equal(j.vencedor, esperado);
    assert.equal(j.pontos, pontos);
  }
});
test("partida encerrada recusa jogar, comprar e passar sem alterar resultado", () => {
  const j = new Partida({ maos: [[[6, 6]], [[0, 1]]], monte: [] });
  j.jogar(0, [6, 6]);
  const antes = estado(j);
  assert.throws(() => j.jogar(1, [0, 1]));
  assert.throws(() => j.comprar(1));
  assert.throws(() => j.passar(1));
  assert.equal(estado(j), antes);
});
test("jogos completos com sementes diferentes conservam as peças e terminam", () => {
  for (let seed = 1; seed <= 30; seed++) {
    const j = new Partida({ rng: rng(seed) });
    let passos = 0;
    while (!j.motivo && passos++ < 200) {
      const op = j.opcoes(j.vez);
      if (op.length) j.jogar(j.vez, op[0].peca, op[0].lado);
      else if (j.monte.length) j.comprar(j.vez);
      else j.passar(j.vez);
      const todas = [...j.maos.flat(), ...j.monte, ...j.mesa].map(chave);
      assert.equal(todas.length, 28);
      assert.equal(new Set(todas).size, 28);
      for (let i = 1; i < j.mesa.length; i++)
        assert.equal(j.mesa[i - 1][1], j.mesa[i][0]);
    }
    assert.ok(j.motivo, `jogo ${seed} não terminou`);
  }
});
