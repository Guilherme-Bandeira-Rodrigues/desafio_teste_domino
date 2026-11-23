const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Partida, conjunto } = require("../src/domino");

test("o conjunto cobre todas as combinações do duplo-seis", () => {
  const pecas = conjunto();
  for (let a = 0; a <= 6; a++)
    for (let b = a; b <= 6; b++)
      assert.equal(pecas.filter((p) => p[0] === a && p[1] === b).length, 1);
});
test("rejeita peças repetidas, inclusive invertidas", () => {
  assert.throws(() => new Partida({ maos: [[[1, 2]], [[2, 1]]], monte: [] }));
  assert.throws(() => new Partida({ maos: [[[7, 2]], [[3, 4]]], monte: [] }));
});
test("sem duplas, abre a peça de maior soma", () => {
  const jogo = new Partida({ maos: [[[1, 5]], [[4, 5]]], monte: [] });
  assert.equal(jogo.vez, 1);
  assert.deepEqual(jogo.inicial, [4, 5]);
  assert.throws(() => jogo.jogar(0, [1, 5]));
});
test("exige a escolha da ponta quando a peça encaixa nas duas", () => {
  const jogo = new Partida({
    maos: [
      [
        [6, 6],
        [1, 2],
      ],
      [[5, 6]],
    ],
    monte: [],
  });
  jogo.jogar(0, [6, 6]);
  assert.throws(() => jogo.jogar(1, [5, 6]));
  jogo.jogar(1, [5, 6], "esquerda");
  assert.deepEqual(jogo.mesa, [
    [5, 6],
    [6, 6],
  ]);
});
test("empate por trancamento não tem vencedor nem pontos", () => {
  const jogo = new Partida({
    maos: [
      [
        [6, 6],
        [0, 5],
      ],
      [[1, 4]],
    ],
    monte: [],
  });
  jogo.jogar(0, [6, 6]);
  jogo.passar(1);
  assert.equal(jogo.motivo, "trancada");
  assert.equal(jogo.vencedor, null);
  assert.equal(jogo.pontos, 0);
  assert.throws(() => jogo.passar(1));
});
