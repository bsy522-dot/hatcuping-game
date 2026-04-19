# menu.js — 4탭 하단 메뉴

도감 / 가방 / 티니핑(파티) / 저장 — 포켓몬 스타트 메뉴 + 카톡풍 디자인.

## API

```js
Menu.open(tabId?)
Menu.close()
Menu.switchTab(tabId)      // 'pokedex'|'bag'|'party'|'save'
Menu.setData({ party, bag })
Menu.draw(ctx, W, H)
Menu.handleClick(x, y, W, H) → bool   // 탭바/닫기 처리
Menu.isOpen() → bool
```

### Data 형식

```js
party = [{id,name,lv,hp,maxHp,type}, ... max 6]
bag   = [{id,name,count,icon}]
```

## State

- `open`, `tab` (현재 탭), `party`, `bag`
- 도감 탭은 `window.Pokedex.render(ctx,x,y,w,h)` 위임

## 시각 목업 (ASCII)

```
┌─────────────────────────┐
│  💖 티니핑        [✕]   │  ← 타이틀
├─────────────────────────┤
│ ┌─────────┐ ┌─────────┐ │
│ │ (●)  로미 │ │ (●) 베베│ │  ← 6슬롯 2x3
│ │ Lv5      │ │ Lv3    │ │
│ │ ████░    │ │ ███░░  │ │
│ └─────────┘ └─────────┘ │
│   ...빈 슬롯 4개         │
├─────────────────────────┤
│ 📖   🎒   💖    💾     │  ← 탭바
│ 도감 가방 티니핑 저장    │
└─────────────────────────┘
```

## 원작 UI 참고

- 카톡 하단 탭바 느낌 (4아이콘 + 라벨)
- 포켓몬 스타트 메뉴 6슬롯 파티
- 활성 탭은 상단 3px 컬러 언더라인
