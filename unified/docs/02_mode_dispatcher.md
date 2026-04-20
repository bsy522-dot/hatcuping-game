# Mode Dispatcher — 모드 시스템 설명

## 목적
3개 장르 게임플레이(대화/플랫포머/포켓몬식)를 **하나의 엔진 루프**에서 매끄럽게 전환하기 위한 디스패처.

모든 엔진은 동일한 인터페이스를 따르고, `window.Dispatcher`가 `STATE.mode`를 보고 프레임마다 알맞은 엔진에 `update` / `render` / `handleInput`을 위임한다.

## 지원 모드

| `STATE.mode`   | 엔진 글로벌               | 용도                    |
|----------------|---------------------------|-------------------------|
| `v2_scene`     | `window.SceneEngine`      | 카톡식 대화 컷씬        |
| `platformer`   | `window.PlatformerEngine` | Act2 성 탈출 (마리오식) |
| `dodge`        | `window.DodgeEngine`      | Act1.5 시야 회피        |
| `run`          | `window.RunEngine`        | Act3 버스 러닝          |
| `v3_map`       | `window.V3Map`            | 탐색 맵 (포켓몬식)      |
| `v3_battle`    | `window.V3Battle`         | 턴제 전투               |
| `cutscene`     | `window.CutsceneEngine`   | 비대화 연출             |

## 엔진 인터페이스 (엔진 제작자용)

각 엔진은 다음 메서드 중 **필요한 것만** 구현하면 된다. 없는 메서드는 Dispatcher가 조용히 무시한다.

```js
window.XxxEngine = {
  // (선택) 모드가 활성화될 때 1회 호출. opts는 switchMode의 두 번째 인자 그대로.
  onEnter(opts){ /* 초기화, 리소스 세팅 */ },

  // (선택) 모드가 전환될 때 1회 호출. nextMode는 다음 모드 이름.
  onExit(nextMode){ /* 정리 */ },

  // 프레임 업데이트 (60fps 가정). 없어도 OK.
  update(){ /* 로직 */ },

  // 렌더링. ctx는 2D 컨텍스트, W/H는 논리 해상도 (420/750).
  render(ctx, W, H){ /* 그리기 */ },

  // 입력. kind는 'down'|'up'|'move' 또는 키보드 이벤트 객체 {type:'key', key, down, evt}.
  handleInput(x, y, kind){ /* 처리 */ }
};
```

## 공용 API (다른 에이전트/엔진이 부를 API)

### `Dispatcher.switchMode(newMode, opts)`
현재 모드를 전환한다. 기본 0.3초 페이드 인 트랜지션 포함.

```js
// 예시: Act2 클리어 후 v2_scene에서 버스 러닝으로 전환
Dispatcher.switchMode('run', { act: 3, scene: 0 });

// 페이드 없이 즉시 전환
Dispatcher.switchMode('v3_map', { fade: false });

// 같은 모드 강제 재진입
Dispatcher.switchMode('v3_map', { force: true });
```

`opts` 는 엔진의 `onEnter(opts)`에 그대로 전달된다. 권장 필드:
- `fade: false` — 트랜지션 생략
- `force: true` — 같은 모드여도 재진입
- `act`, `scene`, `mapId` 등 엔진이 해석하는 자유 필드

### `Dispatcher.getCurrentEngine()`
현재 활성 엔진 객체(`window.SceneEngine` 등)를 반환. 미구현 시 `null`.

### 내부 흐름
```
hatcuping-unified.html
  └─ 매 프레임 requestAnimationFrame 에서
     ├─ Dispatcher.update()   → getCurrentEngine()?.update?.()
     └─ Dispatcher.render()   → getCurrentEngine()?.render?.(ctx, W, H)

입력(터치/마우스/키보드)
  └─ Dispatcher.handleInput(x, y, kind)
         → getCurrentEngine()?.handleInput?.(x, y, kind)
```

## 트랜지션

`switchMode` 시 `STATE.transition = { t, dur, dir:'in' }` 이 세팅되고, Dispatcher가 매 프레임 감쇠하며 렌더 후 알파 오버레이를 덮어 페이드 인 효과를 낸다. 끝나면 `null` 로 돌아간다.

엔진 입장에서는 트랜지션을 신경 쓸 필요 없다 — Dispatcher가 자동 처리.

## 안전장치

- 엔진이 아직 로드 안 됐으면? → 플레이스홀더 화면 표시 ("mode: xxx / 엔진 로딩 대기중…")
- 엔진의 `update` / `render` 에서 throw? → try/catch 로 잡고 콘솔 에러 + 다음 프레임 계속
- 알 수 없는 모드로 `switchMode`? → `console.warn` 후 현재 모드 유지

## 다음 에이전트를 위한 체크리스트

- [ ] `unified/engines/XXX.js` 파일을 만들고 `window.XxxEngine = { ... }` 정의
- [ ] `hatcuping-unified.html` 의 `<!-- 주석 처리된 script 태그 -->` 중 해당 줄의 주석 해제
- [ ] 필요 시 `STATE` 에 필드 추가 (단, 기존 필드 삭제 금지)
- [ ] `Dispatcher.switchMode('다른_모드')` 로 다음 단계 넘기기
- [ ] 저장이 필요하면 `UnifiedSave.save()` 호출
