# rpg-v3 / systems

하츄핑 RPG v3의 게임 시스템 모듈 모음. 모두 바닐라 JS IIFE로 `window.*` 전역에 붙으며, ES 모듈 없이 `<script src>` 로딩 순으로 사용.

## 로딩 순서 (index.html)

```html
<!-- data 먼저 -->
<script src="data/types.js"></script>
<script src="data/tiniping_dex.js"></script>
<script src="data/maps.js"></script>

<!-- systems: 의존성 오름차순 -->
<script src="systems/save.js"></script>
<script src="systems/party.js"></script>
<script src="systems/evolution.js"></script>
<script src="systems/pokedex.js"></script>
<script src="systems/battle.js"></script>
<script src="systems/capture.js"></script>
<script src="systems/gym.js"></script>
```

## 모듈 인덱스

| 모듈 | 전역 | 역할 | 문서 |
|---|---|---|---|
| battle.js | `window.Battle` | 턴제 전투 엔진 | [battle.md](./battle.md) |
| capture.js | `window.Capture` | 마음구슬 포획 | [capture.md](./capture.md) |
| evolution.js | `window.Evolution` | 진화/로열 각성 | [evolution.md](./evolution.md) |
| pokedex.js | `window.Pokedex` | 41종 도감 4탭 | [pokedex.md](./pokedex.md) |
| save.js | `window.SaveGame` | localStorage 세이브 | [save.md](./save.md) |
| gym.js | `window.Gym` | 8 체육관/배지 | [gym.md](./gym.md) |
| party.js | `window.Party` | 파티/박스/레벨업 | [party.md](./party.md) |

## 공통 전역 상태

```js
window.STATE = {
  party: [],          // 최대 6
  box: [],            // 무제한
  hearts: 5,          // 마음구슬
  badges: [],         // 획득 배지
  items: {},          // 아이템 수량
  storyFlags: {},     // 스토리 플래그 (jewelDragonBlessing 등)
  pokedex: { seen:{}, caught:{} },
  currentMap: 'heart_village',
  playerPos: { x:0, y:0 },
  act: 1
};
```

## 의존성 그래프

```
data/types.js ──┐
data/tiniping_dex.js ──┬──> battle ──> capture
                       │              └─> party ──> evolution
                       └──> pokedex
                            gym ──> battle
save <── (STATE 전역)
```

## 원작 매칭 요약

- 감정타입 10종 + 상성 (사랑↔어둠, 얼음↔불 등)
- 4분류 41종 (로열/일반/빌런/레전드)
- 일반→로열 "각성"은 보석드래곤 축복 필요
- 8 체육관 = 8 감정 배지 (사랑/정직/용기/여유/얼음/불/어둠/별)
- 포획 = 마음구슬(하트) 소모
