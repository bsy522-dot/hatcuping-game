# 06. Platformer Engine — Act2 성 탈출

담당 파일:
- `unified/engines/engine_platformer.js`
- `unified/story/act2_escape.js`
- `unified/story/act2_post.js`

## 1. 엔진 개요

세로 420×750 모바일 Canvas 위에서 동작하는 마리오식 가로 스크롤 플랫포머.
로미가 성 안을 돌파해 바깥으로 탈출하는 Act2 전용 엔진.

공개 API:

```js
window.PlatformerEngine = {
  start(opts),      // opts:{ levels, onClear, returnTo }
  stop(),
  update(),
  render(ctx, W, H),
  handleInput(x, y, kind),  // kind: 'down'|'up'|'tap'|'enter'
  onEnter(opts),    // Dispatcher.switchMode('platformer', opts)
  onExit()
};
```

## 2. 조작법

### 키보드
| 입력 | 동작 |
|------|------|
| ← / A | 좌 이동 |
| → / D | 우 이동 |
| ↑ / W / Space | 점프 |
| Z | (보스 QTE) 연타 |

### 터치
- 좌하단 `<` `>` 버튼 = 좌우 이동
- 우하단 `JUMP` 버튼 = 점프
- 보스 QTE: 화면 아무 곳 탭으로도 카운트

## 3. 물리 상수

| 상수 | 값 | 의미 |
|------|-----|------|
| GR   | 0.5  | 중력 (px/frame²) |
| JMP  | -10  | 점프 초기 속도 |
| SPD  | 3    | 좌우 이동 속도 |
| MXF  | 12   | 낙하 최대 속도 |
| PW   | 32   | 로미 hitbox 가로 |
| PH   | 48   | 로미 hitbox 세로 |
| CAM_ANCHOR_X | 170 | 로미가 고정되는 화면 x (월드가 움직임) |
| FALL_Y | 900 | 낙사 판정 y |
| INVULN_FRAMES | 60 | 피격 후 무적(1초 @60fps) |

## 4. 레벨 데이터 형식

```js
{
  id: 'corridor',
  title: '성 복도',
  bg: 'bg_corridor',       // IM[key] 이미지 키
  palette: [...],          // 폴백 그라데이션 3색
  spawn: { x, y },
  worldW: 2400,            // (미지정 시 플랫폼 범위로 자동 산출)
  bossFloor: 560,          // 보스 레벨 전용: 보스 바닥 y
  platforms: [{ x, y, w, h, type:'stone'|'wood'|'roof' }],
  hazards:   [{ x, y, w, h, type:'spike' }],     // 접촉 시 데미지
  enemies:   [{ x, y, kind, w, h }],             // 밟으면 처치, 접촉하면 데미지
  goal:      { x, y, w, h },                     // 닿으면 레벨 클리어
  goalLabel: '다음',
  boss:      { name, x, y }                      // 존재하면 보스전
}
```

충돌 규칙:
- 플랫폼은 **위에서 착지만** 유효 (원본 hatcuping-game.html 패턴 준수).
- 가시(spike)는 위/아래/옆 모두 데미지.
- 적은 점프로 밟으면 처치(반동 점프), 접촉하면 데미지.
- 낙사(`y > 900`)는 즉사.
- HP 0 → 레벨 재시작(HP 자동 회복 → 무한 시도 가능).

## 5. 레벨 4종 공략

### Level 1 — 복도 (약 40~60초)
- 평탄한 바닥 1구간이 끊어져 있고 아래에 가시. **짧은 점프 1회**로 건넌다.
- 경비병 2명은 점프 착지 스매시로 처치 가능(회피도 OK).
- 중간 목재 플랫폼은 선택 루트(고지대 스킵).

### Level 2 — 대계단 (약 60~90초)
- 왼→오 올라가며 수직 상승. 계단 플랫폼은 폭 80, 간격 40.
- 중간 두 번의 **좁은 가시 구간**. 계단을 밟고 연속 점프로 상단까지.
- 상단 좁은 목재 플랫폼(폭 60) 5개 연속 — 타이밍 점프.
- 경비병 2명은 위에서 내려 찍어 처치.

### Level 3 — 지붕 (약 60~80초)
- 플랫폼 간격이 넓음(최대 120 px). **풀 점프(JMP=-10) + 관성**으로 넘는다.
- 틈새는 낙사. 떨어지면 즉시 레벨 재시작.
- 중간 보조 점프대(wood, 폭 50)를 활용하면 안정적.
- 까마귀(raven) 2마리는 무시하거나 밟고 반동 점프.

### Level 4 — 중정 성기사 보스 (약 60~120초)
- 보스 등장 1초 대기 후 패턴 개시.
- 보스 3-히트 패턴(아래 상세). 각 사이클 끝에서 **Z 연타 QTE** 성공 시 보스 HP 1 감소.
- 보스 HP 0 → 쓰러짐(1.5초) → **할머니 등장 컷신** → onClear.

## 6. 성기사 보스 패턴

| 단계 | 동작 | 대응 |
|------|------|------|
| intro (60f) | 포효/정지 | 위치 잡기 |
| pattern 0: 돌진 | 플레이어 방향으로 `4.2 px/frame` 돌진 (140f) | 점프로 넘기 or 회피 플랫폼 |
| pattern 1: 점프 공격 | `vy=-12`로 플레이어 쪽 급강하 | 좌우 달려서 회피 |
| pattern 2(충격파) | 착지 순간 좌우로 충격파 1발 | 점프 중 피격 X — 점프 타이밍 맞추기 |
| 짧은 틈(50f) | 보스 정지 | 딜 기회 아님 — 다음 사이클 준비 |

3번의 사이클(돌진→점프→충격파)을 완료할 때마다 보스가 `stunned` 상태로 40프레임 경직 → 자동 **QTE 개시**:

- 제한 시간: 90 frame (1.5초)
- 필요 탭: 6회 (Z키 또는 화면 탭)
- 성공: 보스 HP 1 차감
- 실패: 로미 1 데미지 + 패턴 재개

보스 HP 3 모두 깎으면 쓰러진다. 이후 즉시 컷신.

## 7. 할머니 컷신

`_spawnGrandma()` 호출 시 로미와 보스 옆에 할머니 스프라이트(플레이스홀더)가 등장하고, 하단에 3줄 자막이 80프레임 간격으로 진행:

1. 할머니: "로미야... 괜찮니?"
2. 로미: "할머니... 저 가야 해요"
3. 할머니: "잘 가거라, 내 아가야..."

탭/Enter로 건너뛰기 가능. 마지막 줄 후 `onClear()` 호출.

### onClear → Act2_Post
Act2_Post(`v2_scene` 모드)의 전체 대화 진행 (2씬: 재회 → 작별).
완료 시 `v3_map` 모드로 전환, 성문 앞 맵으로 이동 예정.

## 8. 단독 검증

```js
PlatformerEngine.start({
  levels: window.ACT2.LEVELS,
  onClear: () => console.log('Act2 done')
});
// Dispatcher 루프가 자동으로 update/render 호출
Dispatcher.switchMode('platformer', { levels: window.ACT2.LEVELS, onClear: ()=>{} });
```

각 레벨은 단독 재시작 가능 — HP 0 되면 `_loadLevel(S.levelIdx)` 호출로 루프.

## 9. 의도 / 설계 노트

- **원본 hatcuping-game.html을 건드리지 않음.** 물리 패턴만 참고(GR/JMP/plat 충돌).
- 원본 파라미터(JMP=-11.5, SPD=4.2)는 사용자 지시(JMP=-10, SPD=3)에 맞게 재조정.
- 레벨 플랫폼 좌표는 현재 상수(SPD=3, JMP=-10) 기준으로 최대 점프 거리(수평≈120px, 수직≈100px) 내에서 설계됨 → 모든 레벨 **골드패스** 확보.
- 로미가 "중앙 고정, 월드가 움직인다"는 요구: `CAM_ANCHOR_X=170` 기준 카메라 추적.
- 보스 QTE는 Z 키 외 **화면 탭**도 카운트 (모바일 대응).
- 컷신은 영화 감성을 위해 **짧고 여백 있는 대사** 3줄. 본격 대화는 `ACT2_POST`(v2_scene)에서 이어감.
