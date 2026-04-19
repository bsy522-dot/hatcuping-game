# katok_dialog.js — 카카오톡 스타일 대화창

원작 '사랑의 하츄핑' 애니메이션의 카톡풍 대화 연출을 Canvas 2D로 재현.

## API

```js
KatokDialog.show(payload, onDone?)
KatokDialog.advance()            // 탭/클릭 시 호출
KatokDialog.isActive() → bool
KatokDialog.draw(ctx, W, H)
```

### payload 형식

```js
{
  actors: [
    { id:'romi',  name:'로미',      side:'right' },
    { id:'bebe',  name:'베베핑',    side:'left'  },
  ],
  dialog: [
    { who:'bebe', text:'로미야, 어디가?' },
    { who:'romi', text:'하츄핑 찾으러!' },
  ]
}
```

## State

- `active`: 대화창 활성 여부
- `queue`: 남은 대사
- `history`: 표시된 대사 스택 (최근 2개 노출)
- 타이핑 30ms/char, 탭으로 스킵/다음

## 시각 목업 (ASCII)

```
┌─────────────────────────────────┐
│                                 │
│  ○ 베베핑                        │
│ ┌─────────────┐                 │
│ │ 로미야, 어디가? │                 │
│ └─────────────┘                 │
│                  ┌─────────────┐│
│                  │ 하츄핑 찾으러! ││
│                  └─────────────┘│  ← 우측 노랑
│                      ▶ 탭: 다음  │
└─────────────────────────────────┘
```

## 원작 UI 참고

- 카카오톡 채팅방 UI: 좌측 NPC 회색, 우측 자신 노란색(#FEE500)
- 애니메이션에서도 로미/파티 사이 카톡 교환 장면 빈출
- 말풍선 꼬리는 아바타 방향으로
