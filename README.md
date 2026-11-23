# Testes de Software — Dominó

## Especificação

Partida de dominó para **dois jogadores**, conforme o desafio da disciplina. As regras não detalhadas no enunciado foram fixadas nesta implementação: conjunto duplo-seis com 28 peças, sete por jogador e compra no monte; abre a maior dupla distribuída ou, na ausência de duplas, a peça de maior soma (desempate pelo maior lado). A primeira jogada deve ser essa peça.

As peças encaixam nas extremidades; quando uma peça pode encaixar nas duas, é preciso escolher o lado. Quem não tem jogada compra até poder jogar; só passa se o monte estiver vazio. Ganha quem esvaziar a mão. Com jogo trancado, vence quem tiver menos pontos; pontua-se a soma da mão do perdedor. Em empate não há vencedor nem pontos.

## Executar

Requer Node.js 20 ou superior. Não há dependências externas.

```sh
npm test
```

Os testes em JavaScript usam `node:test` e `node:assert/strict`. Eles verificam composição e distribuição das peças, abertura obrigatória, orientação nas pontas, turnos, compra, passagem, batida e encerramento por trancamento. Um teste falho produz saída com a asserção e retorno diferente de zero.

## Usar o motor

```js
const { Partida } = require('./src/domino');
const jogo = new Partida();
jogo.jogar(jogo.vez, jogo.inicial, 'direita');
console.log(jogo.mesa, jogo.vez);
```

`opcoes(jogador)` informa peças e lados possíveis; `jogar`, `comprar` e `passar` validam o turno. `mesa`, `maos`, `monte`, `vez`, `vencedor`, `motivo` e `pontos` apresentam o estado. Jogadores são identificados por 0 e 1. É possível passar `maos` e `monte` ao construtor para situações determinísticas.

## Contrato e organização dos testes

Peças invertidas representam a mesma peça; a mesa, porém, armazena a orientação para que casas adjacentes coincidam. Compra retira a primeira peça do monte e mantém a vez. Jogadas, compras e passagens inválidas lançam erro sem modificar o estado. Na batida, `motivo` é `batida`; no bloqueio com monte vazio é `trancada`. O desempate da abertura sem duplas usa a maior face após comparar a soma.

Os testes em `test/` especificam distribuição, opções, abertura, orientação, compra, bloqueio, pontuação e erros. Partidas reproduzíveis verificam, a cada passo, conservação das 28 peças e continuidade da mesa. A distribuição aceita `rng` que retorna números em `[0, 1)`.

## Colaborador

Guilherme-Bandeira-Rodrigues
