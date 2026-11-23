"use strict";
function conjunto() {
  const p = [];
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) p.push([a, b]);
  return p;
}
function chave(p) {
  if (
    !Array.isArray(p) ||
    p.length !== 2 ||
    !p.every((n) => Number.isInteger(n) && n >= 0 && n <= 6)
  )
    throw new Error("Peça inválida");
  return [...p].sort((a, b) => a - b).join(",");
}
function embaralhar(a, rng) {
  const b = a.map((p) => [...p]);
  for (let i = b.length - 1; i > 0; i--) {
    const r = rng();
    if (typeof r !== "number" || !(r >= 0 && r < 1))
      throw new Error("rng inválido");
    const j = Math.floor(r * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
class Partida {
  constructor({ rng = Math.random, maos = null, monte = null } = {}) {
    if (maos === null) {
      const p = embaralhar(conjunto(), rng);
      maos = [p.slice(0, 7), p.slice(7, 14)];
      monte = p.slice(14);
    }
    if (
      !Array.isArray(maos) ||
      maos.length !== 2 ||
      maos.some((m) => !Array.isArray(m) || !m.length)
    )
      throw new Error("Duas mãos não vazias são necessárias");
    const usadas = maos.flat().map(chave);
    if (monte === null)
      monte = conjunto().filter((p) => !usadas.includes(chave(p)));
    const todas = [...usadas, ...monte.map(chave)];
    if (new Set(todas).size !== todas.length)
      throw new Error("Peças repetidas");
    this.maos = maos.map((m) => m.map((p) => [...p]));
    this.monte = monte.map((p) => [...p]);
    this.mesa = [];
    this.vencedor = null;
    this.motivo = null;
    this.pontos = 0;
    const candidatas = this.maos.flatMap((m, j) => m.map((p) => ({ p, j })));
    const duplas = candidatas.filter(({ p }) => p[0] === p[1]);
    const grupo = duplas.length ? duplas : candidatas;
    grupo.sort((x, y) =>
      duplas.length
        ? y.p[0] - x.p[0]
        : y.p[0] + y.p[1] - (x.p[0] + x.p[1]) ||
          Math.max(...y.p) - Math.max(...x.p),
    );
    this.vez = grupo[0].j;
    this.inicial = [...grupo[0].p];
  }
  opcoes(j) {
    this.verJogador(j);
    if (!this.mesa.length)
      return this.maos[j]
        .filter((p) => chave(p) === chave(this.inicial))
        .map((p) => ({ peca: [...p], lado: "direita" }));
    const esq = this.mesa[0][0],
      dir = this.mesa.at(-1)[1],
      out = [];
    for (const p of this.maos[j]) {
      if (p.includes(esq)) out.push({ peca: [...p], lado: "esquerda" });
      if (p.includes(dir)) out.push({ peca: [...p], lado: "direita" });
    }
    return out;
  }
  verJogador(j) {
    if (j !== 0 && j !== 1) throw new RangeError("Jogador inválido");
  }
  turno(j) {
    this.verJogador(j);
    if (this.motivo || j !== this.vez) throw new Error("Turno inválido");
  }
  jogar(j, p, lado) {
    this.turno(j);
    const k = chave(p),
      i = this.maos[j].findIndex((x) => chave(x) === k);
    if (i < 0) throw new Error("Peça não pertence à mão");
    const op = this.opcoes(j).filter((x) => chave(x.peca) === k);
    if (!lado && op.length === 1) lado = op[0].lado;
    if (!op.some((x) => x.lado === lado))
      throw new Error("Encaixe inválido ou ambíguo");
    let x = [...this.maos[j][i]];
    if (this.mesa.length) {
      if (lado === "esquerda") {
        if (x[1] !== this.mesa[0][0]) x.reverse();
        this.mesa.unshift(x);
      } else {
        if (x[0] !== this.mesa.at(-1)[1]) x.reverse();
        this.mesa.push(x);
      }
    } else this.mesa.push(x);
    this.maos[j].splice(i, 1);
    if (!this.maos[j].length) {
      this.vencedor = j;
      this.motivo = "batida";
      this.pontos = this.maos[1 - j].flat().reduce((a, b) => a + b, 0);
    } else this.vez = 1 - j;
  }
  comprar(j) {
    this.turno(j);
    if (this.opcoes(j).length || !this.monte.length)
      throw new Error("Compra inválida");
    const p = this.monte.shift();
    this.maos[j].push(p);
    return [...p];
  }
  passar(j) {
    this.turno(j);
    if (this.opcoes(j).length || this.monte.length)
      throw new Error("Não pode passar");
    if (!this.opcoes(1 - j).length) {
      const s = this.maos.map((m) => m.flat().reduce((a, b) => a + b, 0));
      this.motivo = "trancada";
      this.vencedor = s[0] === s[1] ? null : s[0] < s[1] ? 0 : 1;
      this.pontos = this.vencedor === null ? 0 : s[1 - this.vencedor];
    } else this.vez = 1 - j;
  }
}
module.exports = { conjunto, Partida };
