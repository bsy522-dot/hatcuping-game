# hud.js — 전투/맵 공용 HUD

포켓몬식 HP 바와 카톡풍 컬러링을 결합한 공용 HUD 모듈.

## API

```js
HUD.drawBattleHUD(ctx, W, H, enemy, player)
HUD.drawMapHUD(ctx, W, H, info)
HUD.drawMiniMap(ctx, W, H, map)
```

### 입력 형식

```js
// 전투
enemy  = { name, lv, hp, maxHp, type }
player = { name, lv, hp, maxHp, exp, maxExp, type }

// 맵
info   = { hearts, badges:[bool x8], location, leader }

// 미니맵
map    = { grid:[[0,1,2,...]], px, py }
//   0=벽, 1=길(녹), 2=물(청)
```

## State

내부 상태 없음 — 매 프레임 호출되는 순수 렌더 함수.

## 시각 목업 (ASCII)

### Battle HUD
```
┌─────────────────────────┐
│               ┌───────┐ │
│               │ 베베 Lv3│ │  ← 우상단 적
│               │ ████░  │ │
│               └───────┘ │
│                         │
│ ┌────────────┐          │
│ │ 로미  Lv 5 │          │  ← 좌하단 플레이어
│ │ ██████░ 28/40│        │
│ │ ▰▰▰▱▱ EXP │          │
│ └────────────┘          │
└─────────────────────────┘
```

### Map HUD
```
┌─────────────────────────┐
│ 💖×5  ○○●●○○○○  [≡메뉴] │  ← 상단
│                         │
│      (맵 영역)           │
│                         │
│ (●) 📍 티니핑 마을       │  ← 하단
│     리더: 로미           │
└─────────────────────────┘
```

## 원작 UI 참고

- 포켓몬 정통 HP바 (초록→노랑→빨강 구현은 후속)
- 배지 8개는 티니핑 지역별 상징
- 로미/파티 리더 아바타로 현재 선두 티니핑 표시
