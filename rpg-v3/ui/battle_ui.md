# battle_ui.js — 전투 커맨드/스킬/포획 UI

포켓몬식 4커맨드 + 카톡풍 전투 로그.

## API

```js
BattleUI.drawCommands(ctx, W, H)
BattleUI.drawSkills(ctx, W, H)
BattleUI.drawBag(ctx, W, H)
BattleUI.drawCapturePrompt(ctx, W, H, target)
BattleUI.drawLog(ctx, W, H)
BattleUI.addLog(line)
BattleUI.setState({ skills?, bagItems?, onAction? })
BattleUI.handleInput(x, y) → { kind, id } | null
BattleUI.getMode() / BattleUI.setMode(m)
```

### Data 형식

```js
skills   = [{ name, pp, maxPp, type, power }]  // 최대 4
bagItems = [{ id, name, count, icon, kind:'capture'|'heal' }]
target   = { name, rate }   // 포획 프롬프트
onAction = (kind, id) => {...}
//   kind: 'command'|'skill'|'item'|'capture'|'nav'
```

## State

- `mode`: commands/skills/bag/capture
- `log`: 최근 3줄
- `hitAreas`: draw 시 갱신되는 클릭 영역

## 시각 목업 (ASCII)

### Commands (2x2)
```
┌─────────────────────────┐
│ ▸ 베베의 공격!            │  ← 로그 3줄
│ ▸ 로미가 당황했다!         │
│ ▸ 효과는 굉장했다!         │
├──────────┬──────────────┤
│ ⚔️ 싸우기  │ 💖 티니핑      │
├──────────┼──────────────┤
│ 🎒 가방   │ 💨 도망        │
└──────────┴──────────────┘
```

### Skills (2x2)
```
┌──────────┬──────────────┐
│ 하트빔    │ 사랑의 펀치    │
│ 사랑      │ 사랑          │
│    PP 15/15│    PP 10/10 │
├──────────┼──────────────┤
│ 반짝반짝  │ (빈 슬롯)     │
│              [◀ 뒤로]   │
└──────────┴──────────────┘
```

### Capture Prompt
```
     ┌───────────────┐
     │💖 하트로 포획?  │
     │ 대상: 베베핑    │
     │ 성공률: 60%     │
     │ [💖 포획][취소] │
     └───────────────┘
```

## 원작 UI 참고

- 포켓몬 커맨드 배치 (싸우기/파티/가방/도망) 유지
- 가방 → 하트(포획)/회복템 2종
- 카톡풍: 로그 박스에 노란 테두리 + `▸` 접두사
