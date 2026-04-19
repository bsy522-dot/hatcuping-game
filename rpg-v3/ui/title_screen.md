# title_screen.js — 타이틀 화면

그라디언트 배경 + 상승하는 하트 파티클 + 4버튼.

## API

```js
TitleScreen.init(onSelect)    // onSelect(id:'new'|'load'|'dex'|'credit')
TitleScreen.update(dt)        // 파티클 이동
TitleScreen.draw(ctx, W, H)
TitleScreen.handleClick(x, y) → buttonId | null
```

## State

- `particles`: 20개의 하트 (x, y, size, vy, alpha)
- `buttons`: 매 draw마다 갱신되는 히트박스
- 이어하기 버튼은 `SaveGame.exists()` 혹은 `localStorage.hatcuping_save` 확인

## 시각 목업 (ASCII)

```
┌─────────────────────────┐
│   💖       💖           │  ← 상승 파티클
│      사랑의 하츄핑       │
│       RPG v3 ✨         │
│    원작 스토리 완전판     │
│                         │
│       💖                │
│    ┌───────────┐        │
│    │ 🎮 새 게임 │        │
│    └───────────┘        │
│    ┌───────────┐        │
│    │ 💾 이어하기│        │
│    └───────────┘        │
│    ┌───────────┐        │
│    │ 📖 도감    │        │
│    └───────────┘        │
│    ┌───────────┐        │
│    │ ✨ 크레딧  │        │
│    └───────────┘        │
│                         │
│ PRISM Studio © 2026     │
└─────────────────────────┘
```

## 원작 UI 참고

- 색상: #FF6B9D(핑크) → #FFD54F(옐로) → #4FC3F7(블루) 수직 그라디언트
- 하트 파티클: 원작 오프닝의 하트 이펙트 오마주
- 세이브 없을 시 '이어하기' 반투명/비활성
