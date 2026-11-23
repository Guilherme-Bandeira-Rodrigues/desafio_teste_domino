const { test } = require("node:test");
const a = require("node:assert/strict");
const { conjunto, Partida } = require("../src/domino");
test("duplo seis contém 28 peças distintas e distribui 7 a cada jogador", () => {
  a.equal(new Set(conjunto().map((p) => p.join(","))).size, 28);
  const g = new Partida({ rng: () => 0.5 });
  a.deepEqual(
    g.maos.map((m) => m.length),
    [7, 7],
  );
  a.equal(g.monte.length, 14);
});
test("começa maior dupla e orienta peças nas pontas", () => {
  const g = new Partida({
    maos: [
      [
        [6, 6],
        [1, 6],
      ],
      [
        [1, 2],
        [2, 3],
      ],
    ],
    monte: [],
  });
  a.equal(g.vez, 0);
  a.throws(() => g.jogar(0, [1, 6]));
  g.jogar(0, [6, 6]);
  a.throws(() => g.jogar(0, [1, 6]));
  g.passar(1);
  g.jogar(0, [1, 6], "direita");
  a.deepEqual(g.mesa, [
    [6, 6],
    [6, 1],
  ]);
  a.equal(g.vencedor, 0);
  a.equal(g.pontos, 8);
});
test("compra obrigatória e proibição de passar", () => {
  const g = new Partida({
    maos: [
      [
        [6, 6],
        [0, 1],
      ],
      [[1, 2]],
    ],
    monte: [[2, 6]],
  });
  g.jogar(0, [6, 6]);
  a.throws(() => g.passar(1));
  a.deepEqual(g.comprar(1), [2, 6]);
  a.throws(() => g.comprar(1));
  g.jogar(1, [2, 6], "esquerda");
  a.deepEqual(g.mesa, [
    [2, 6],
    [6, 6],
  ]);
});
test("partida trancada decide por pontos", () => {
  const g = new Partida({
    maos: [
      [
        [6, 6],
        [0, 1],
      ],
      [[2, 3]],
    ],
    monte: [],
  });
  g.jogar(0, [6, 6]);
  g.passar(1);
  a.equal(g.motivo, "trancada");
  a.equal(g.vencedor, 0);
  a.equal(g.pontos, 5);
});
