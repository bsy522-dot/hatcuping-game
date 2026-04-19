# evolution.js - 진화 시스템

## Purpose
레벨업 이후 `evolveLv` 도달시 진화 후보 체크. 일반→로열 "각성"의 경우 `storyFlags.jewelDragonBlessing` 필수.

## API

| Method | Params | Returns | 설명 |
|---|---|---|---|
| `check(mon)` | 개체 | `{from, toName}` or null | 진화 가능 여부 판단 |
| `trigger(mon, onDone)` | 개체, 콜백 | bool | 진화 실행+스탯 재계산 |
| `animate(mon, evo, done)` | - | - | 1.2s 화이트 플래시 + 팡파레 |

## 각성 규칙
```js
if (species.class === 'normal' && evolveToSpecies.class === 'royal') {
  requires STATE.storyFlags.jewelDragonBlessing === true;
}
```

## Usage
```js
var r = Party.levelUp(mon, 50);
if(r.evolve) Evolution.trigger(mon, function(ok){ /* UI 갱신 */ });
```

## 원작 매칭
극장판에서 하츄핑이 로미의 사랑을 받아 "러브하츄핑"으로 각성 — 보석드래곤의 축복 플래그로 게임화. 빌런은 원칙적으로 진화 불가.
