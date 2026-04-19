# party.js - 파티/박스 관리

## Purpose
최대 6 파티 + 무제한 박스. 레벨업·회복·진화 체크 위임.

## API

| Method | Params | Returns | 설명 |
|---|---|---|---|
| `add(mon)` | 개체 | `'party'\|'box'` | 자동 라우팅 |
| `remove(idx)` | 파티 index | 개체 or null | 파티에서 제거 |
| `swap(i, j, target)` | target=`'party'\|'box'` | bool | 순서변경/박스스왑 |
| `box()` | - | mon[] | 박스 배열 |
| `getLeader()` | - | mon or null | party[0] |
| `heal()` | - | 회복된 수 | 전원 HP/상태 초기화 |
| `levelUp(mon, exp)` | 개체, 경험치 | `{leveled, evolve?}` | 자동 스탯 상승, 진화 플래그 반환 |

## 레벨업 공식
- `expForNext(lv) = floor(10 * lv^1.5)`
- 스탯: HP+3, ATK/DEF/spA/spD +2, SPD +1

## Usage
```js
var r = Party.levelUp(mon, 35);
if(r.evolve) Evolution.trigger(mon);
Party.heal(); // 보석드래곤 성소
```

## 원작 매칭
파티 6 = 포켓몬 관례. 박스는 원작의 "티니핑하우스"에 대응. 회복은 보석드래곤 성소/티니핑센터.
