# RPG v3 아키텍처

## 레이어 다이어그램

```
┌─────────────────────────────────────────────┐
│               index.html (부트)              │
│   canvas 420×750 + 인라인 v2 엔진 (현재)    │
└──────────┬──────────────────────────────────┘
           │ <script src>
  ┌────────┴────────┐
  │   에셋 (부모)    │  sprites_data.js, env_backgrounds.js
  └────────┬────────┘
           │
  ┌────────┴────────┐
  │   data/         │  types → dex → maps
  └────────┬────────┘
           │
  ┌────────┴────────┐
  │   story/        │  act0~5 시나리오
  └────────┬────────┘
           │
  ┌────────┴────────┐
  │   systems/      │  save→party→battle→capture→evolution→pokedex→gym
  └────────┬────────┘
           │
  ┌────────┴────────┐
  │   ui/           │  katok_dialog, hud, menu, battle_ui, title_screen
  └─────────────────┘
```

## 의존성 규칙

1. **data** 레이어는 다른 레이어 참조 금지 (pure data)
2. **story** 는 data 참조 OK (캐릭터 ID 등)
3. **systems** 는 data + window.STATE 참조 OK
4. **ui** 는 systems 호출 OK, 역방향 금지
5. **index.html** 엔진은 모든 레이어 조정자

## STATE 스키마 (공유 전역)

```js
window.STATE = {
  act: 0,                   // 현재 진행 Act
  badges: [],               // 획득한 배지 이름
  party: [                  // 최대 6
    { id:'hatchu', lv:5, hp:55, xp:0, skills:[...] }
  ],
  box: [],                  // 무제한
  pokedex: { seen:{}, caught:{} },
  items: { heart: 5, potion: 0 },
  storyFlags: { jewelDragonBlessing:false, metJenny:false },
  currentMap: 'ion_castle',
  playerPos: { x:7, y:10 },
  version: 'v3'
}
```

## 확장 포인트

**새 Act 추가**:
1. `story/actN.js` 생성
2. `index.html` `<script src>` 추가
3. `Gym.checkUnlock(N)` 조건 갱신

**새 티니핑 추가**:
1. `data/tiniping_dex.js` 배열에 푸시 (no 연속)
2. 스프라이트: `../sprites_data.js` 에 base64 추가 or 팔레트 스왑
3. `Pokedex.render` 자동 반영

**새 체육관 관장**:
1. `systems/gym.js` `LEADERS` 배열에 추가
2. 파티 구성 (티니핑 ID 3~6개)
3. 배지 이름 추가

## 저장 포맷

localStorage key: `'hatcuping_rpg3_save'`

직렬화: `JSON.stringify(STATE)` 전체.

호환성: `STATE.version` 체크 → 구버전 마이그레이션 가능하게 설계.

## 모바일 제약

- 캔버스 420×750 고정 포트레이트
- 가로모드 감지 시 `#landscape-overlay` 표시 (v2 동일)
- DPR 고려한 `resizeCanvas()` (v2 재사용)
- 터치 전용 입력 (`touchstart/end/move`)

## 성능 타겟

- 초기 로드: 2초 이내 (스프라이트 프리로드)
- 프레임: 60fps on 2020+ 기기
- 메모리: 스프라이트 base64 전체 약 1MB
