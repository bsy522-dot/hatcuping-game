# capture.js - 포획 시스템

## Purpose
야생 티니핑을 마음구슬(하트)을 던져 포획. 희귀도·체력·상태이상에 따라 확률이 변한다. 포획 성공시 자동으로 파티(여유 있을 때) 또는 박스로 보냄.

## API

| Method | Params | Returns | 설명 |
|---|---|---|---|
| `attempt(species, enemy, opts)` | species = TINIPING_DEX entry, enemy = 전투 개체 | `{ok, mon?, rate?, reason?}` | 하트 1 소모, 주사위 굴림 |
| `calcCatchRate(species, enemy)` | 동상 | 0~100 | 확률 반환 |
| `addToParty(mon)` | 개체 | void | 파티 < 6 전제 |
| `sendToBox(mon)` | 개체 | void | 무제한 박스 |

## 공식
```
base    = (6 - rarity) * 20    // r1=100, r5=20
penalty = floor(hp% * 50)      // 풀피=50, 빈사=0
bonus   = 10 if status in {sleep, freeze, sweet_lull}
rate    = clamp(base - penalty + bonus, 1, 100)
```

## State
- `STATE.hearts` 감소
- `STATE.pokedex.caught[no] = true`
- `STATE.party` 또는 `STATE.box`에 추가

## Usage
```js
var species = TINIPING_DEX[12]; // 나도핑
var r = Capture.attempt(species, Battle.state.enemy);
if(r.ok) console.log('포획성공', r.mon);
```

## 원작 매칭
원작에서 마음을 얻기 위해 "공감·약화"가 선행 — 체력이 낮고 상태이상에 걸렸을수록 확률 상승으로 표현. 로열(r5)일수록 어렵다.
