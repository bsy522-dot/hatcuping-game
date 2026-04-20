# 07. 미니게임 엔진 (Minigames)

UNIFIED v4는 RPG/플랫포머 사이에 "숨 돌리기" 미니게임을 끼워 넣는다.
둘 다 **실패해도 스토리는 진행**된다. 결과만 `STATE.storyFlags`에 남긴다.

| 미니게임 | 모드 | 파일 | Act | 트리거 | 상태 |
|----------|------|------|-----|--------|------|
| 눈피하기 | `dodge` | `engines/engine_dodge.js` | Act 1.5 | 꽁꽁핑 대화 | 구현 완료 |
| 버스 러닝 | `run`   | `engines/engine_run.js` (별도 에이전트) | Act 3 | 악몽핑 추격전 | **플레이스홀더** |

---

## 1. 눈피하기 (DodgeEngine) — 구현 완료

"사랑의 하츄핑 별빛 대모험" 스타일. 성 창문 앞에서 로미가 눈보라를 맞는다.

### 1.1 진입 / 퇴장

- **진입**: `Dispatcher.switchMode('dodge', opts)` (또는 `DodgeEngine.start(opts)` 직접 호출)
- **퇴장**: 클리어/실패 1초 후 자동으로 `Dispatcher.switchMode('v2_scene', {next: opts.returnTo, dodgeResult})`

### 1.2 opts

```js
{
  duration:    30,   // 버티기 성공 시간 (초). 이 시간 지나면 자동 클리어
  dodgeTarget: 10,   // 피하기 성공 개수. 10개 피하면 클리어
  maxHp:       3,    // 하트 개수
  onClear:     fn(), // (선택) 호출되면 Dispatcher 자동 전환 대신 이 콜백 실행
  onFail:      fn(), // (선택) 실패 콜백
  returnTo:   'act1_post_dodge'  // 종료 후 돌아갈 v2_scene의 씬 id
}
```

### 1.3 성공/실패 판정

- **성공 (clear)**: `dodged >= dodgeTarget` **OR** `t >= duration*60`
  - 화면 아래로 빠진 눈송이 수가 목표 달성
  - 또는 30초 버티기
- **실패 (fail)**: HP 0
  - 눈송이에 3번 맞으면 HP 0

실패해도 스토리는 계속된다. `STATE.storyFlags.dodgeResult = 'clear'|'fail'`로 저장되므로
v2_scene의 `act1_post_dodge`에서 대사를 분기하면 된다.

### 1.4 조작

| 입력 | 동작 |
|------|------|
| 키보드 `←` / `A` | 로미 좌로 이동 |
| 키보드 `→` / `D` | 로미 우로 이동 |
| 터치 탭 | 해당 x 좌표로 부드럽게 이동 |
| 터치 드래그 | 손가락을 따라 이동 |

키보드 리스너는 엔진이 자체 등록하지만, 터치는 Dispatcher의 `handleInput(x, y, kind)`를
통해서만 받는다. (`kind`: `'down'|'move'|'up'`)

### 1.5 밸런싱 숫자

| 항목 | 값 |
|------|----|
| 캔버스 | 420 × 750 (UCanvas 기본) |
| 로미 크기 | 52 × 56 |
| 로미 속도 (키보드) | 5 px/frame |
| 로미 속도 (드래그 추격) | 최대 8 px/frame |
| 스폰 간격 | 30 frame (약 0.5초) |
| 스폰 수 | 1~3개 랜덤 |
| 눈송이 속도 | 2~4 px/frame |
| 눈송이 반지름 | 4~8 px (시각 크기 8~16) |
| 피격 무적 | 45 frame (0.75초) |
| BG 장식 파티클 | 40개 |
| 결과 페이드 | 60 frame (1초) |

### 1.6 시각

- **배경**: 성 창문 뷰 — 깊은 파란 그라데이션, 창틀 십자, 달, 하단 바닥
- **눈송이**: 흰 원 + 6방향 결정 가지 (회전)
- **로미**: `window.IM.rs`(또는 `IM.romi`) 이미지 사용, 없으면 핑크 원 + 리본 플레이스홀더
- **UI**: 상단 반투명 바에 `피하기 X/10`, 남은 초, HP 하트 3개

### 1.7 사운드 (선택)

`window.AM`이 있으면 호출, 없으면 조용히 무시.

| 이벤트 | AM 호출 |
|--------|--------|
| 눈송이 맞음 | `AM.damage()` |
| 클리어 | `AM.victory()` |
| 실패 | `AM.captureFail()` |

### 1.8 단독 테스트

```js
DodgeEngine.start({
  duration: 30,
  dodgeTarget: 10,
  onClear: () => console.log('win'),
  onFail:  () => console.log('lose')
});
// 이후 매 프레임 Dispatcher.update() / Dispatcher.render(ctx, 420, 750) 호출되면 동작
```

### 1.9 스토리 연결 (ACT1_5)

`story/act1_5_snow.js`의 `window.ACT1_5` 객체가 진입/퇴장 훅 데이터를 담는다.

```js
window.ACT1_5 = {
  id: 'act1_5_snow',
  triggerMode: 'dodge',
  opts: { duration: 30, dodgeTarget: 10, maxHp: 3, returnTo: 'act1_post_dodge' },
  onBefore(), onAfter(),   // 스토리 엔진이 호출
  dialogHints: { intro, clearOutro, failOutro }
};
```

---

## 2. 버스 러닝 (RunEngine) — 플레이스홀더

> **주의**: 러닝 미니게임은 별도 에이전트가 추후 추가한다.
> 현재 파일(`engines/engine_run.js`)은 존재하지 않아도 Dispatcher가 조용히 플레이스홀더를 그린다.

### 2.1 예상 인터페이스 (확정 아님, 설계용)

- 모드: `run`
- 장면: Act 3 악몽핑이 버스를 쫓아온다. 로미가 버스 위/앞에서 장애물 회피.
- 조작: 점프(스페이스/탭), 숙이기(아래 화살표/두 손가락)
- opts 예시: `{ distance: 500, obstacleRate: 0.02, returnTo: 'act3_post_run' }`
- 결과: `STATE.storyFlags.runResult = 'clear'|'fail'`

### 2.2 공통 패턴 (두 미니게임 모두)

1. IIFE + `window.X` 등록
2. `start/stop/onEnter/onExit/update/render/handleInput` 인터페이스
3. 실패해도 스토리 진행 (플래그만 저장)
4. 종료 시 1초 페이드 후 `v2_scene`으로 복귀 (`returnTo` opts로 다음 씬 지정)
5. AM/IM은 선택적, 없어도 동작

---

## 3. 스토리 작가 노트

- 눈피하기는 **짧고 상쾌한 리프레시**가 목적. RPG 전투와 플랫포머 사이에 숨 돌리기.
- 플레이어가 여러 번 실패해도 좌절하지 않도록 UX 우선: "실패=스토리 끝"이 아님.
- `dodgeResult`를 분기해 꽁꽁핑의 반응 대사만 달라지게 하면 반복 플레이 가치 생성 가능.
