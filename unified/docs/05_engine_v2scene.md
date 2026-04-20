# 05. SceneEngine (v2 스타일 대화 씬 엔진)

UNIFIED v4에서 **v2 원본의 감성(대형 캐릭터 + 말풍선 + 타이핑)**을 재현하는 대화 엔진.
Dispatcher 모드 키: `v2_scene` → `window.SceneEngine`.

담당: Act1(침실) + 엔진 본체. Foundation과 충돌하지 않도록 `core/*`, `ui/canvas.js`, `hatcuping-unified.html`은 건드리지 않음.

---

## 1. 파일 구성

| 파일 | 역할 |
|------|------|
| `unified/engines/engine_v2scene.js` | `window.SceneEngine` — update/render/handleInput/start |
| `unified/story/act1_morning.js`     | `window.ACT1` — 기상~눈보라 트리거 (6씬) |
| `unified/story/act1_post_dodge.js`  | `window.ACT1_POST` — 눈 피한 후 방 복귀 + 책 발견 (3씬) |
| `unified/story/act1b_book.js`       | `window.ACT1B_BOOK` — 하츄핑 전설서 3페이지 + 결심 (4씬) |

---

## 2. 엔진 공개 API

```js
window.SceneEngine = {
  start(scenesOrSingle, onComplete),  // 시작
  update(),                           // 프레임 업데이트 (타이핑 진행)
  render(ctx, W, H),                  // 렌더 (ctx 생략 시 window.UCanvas 사용)
  handleInput(x, y, kind),            // 탭/클릭 → 다음 대사
  onEnter(opts), onExit(next)         // Dispatcher 훅
}
```

- `start(input, onComplete)`
  - `input`: 단일 씬 객체 또는 씬 배열 (`ACT1.scenes`처럼).
  - `onComplete`: 모든 씬 소진 시 호출.
- `handleInput(kind)`: `kind` 값은 무시하고 진행 트리거로 해석. 타이핑 중이면 즉시 완성 → 이미 완성이면 다음 대사.
- Enter/Space 키도 내부에서 `document.keydown` 으로 바인딩됨.

---

## 3. 데이터 형식

### 단일 씬

```js
{
  id: 'act1_s1_wake',
  location: 'castle_bedroom',
  bg: 'bg_castle',                       // window.IM[bg] 로 이미지 조회, 없으면 그라데이션
  actors: [
    { id:'romi',  name:'로미',   side:'right' },
    { id:'kkong', name:'꽁꽁핑', side:'left',  avatar:'🧊' }
  ],
  dialog: [
    { who:'narration', text:'아침이다. 창밖이 새하얗다.' },
    { who:'kkong',     text:'로미님! 일어났어요?' },
    { who:'romi',      text:'또 너야…?' }
  ]
}
```

- **who** = `narration` 이거나 actors에 없는 id면 나레이션 박스(이탤릭).
- **text**: `\n` 지원. 자동 줄바꿈 22자 기준.
- **emotion**(옵션): 아직 렌더에서 사용 안 함. 후에 이모티콘/흔들기용.
- **bg**: `window.IM[bg]` 키. 없으면 핑크/퍼플 그라데이션 + 별.
- **actors[].side**: `'left'` | `'right'`. 같은 side 중복은 첫 번째만 그려짐.
- **actors[].avatar**(옵션): 이모지 문자열. 스프라이트 없을 때만 사용.

### 스프라이트 키 매핑

`window.SPRITE_KEY[actor.id] → window.IM[...]` 키.

```js
window.SPRITE_KEY = {
  romi:'rs', kkong:'kk', hatchu:'hs', baro:'ba',
  buggreu:'bk', lala:'la', stick:'st', truping:'ts',
  hartking:'hk', liam:'lip'
}
```

Foundation 에이전트가 같은 키로 덮어써도 됨(없으면 엔진 자체 기본값 사용).

---

## 4. 렌더 레이아웃 (420×750)

```
┌────────────────────────┐  0
│      배경 (60%)        │
│                        │
│   [좌 220x220] [우]    │ 450 근방
│     꽁꽁핑    로미     │
├────────────────────────┤  450 (H*0.60)
│   ▼ 말풍선 박스 (40%)   │
│  화자 이름 (노랑)       │
│  본문 타이핑 텍스트...  │
│                        │
│  1/5           ▼ 탭/Enter │
└────────────────────────┘  750
```

- 말하는 actor: 알파 1.0 + sin 바운스 6px.
- 안 말하는 actor: 알파 0.65 + 살짝 바운스.
- 나레이션 대사일 때는 두 캐릭터 모두 디밍(스피커 없음).

---

## 5. Act1 스토리 구조

```
[v2_scene]  ACT1  (로미의 아침)  ── 6씬
   └─ onComplete → Dispatcher.switchMode('dodge', {returnTo:'act1_post_dodge'})

[dodge]     눈덩이 피하기 미니게임 (다른 에이전트 담당)
   └─ 클리어 → Dispatcher.switchMode('v2_scene', {scene:'act1_post_dodge'})

[v2_scene]  ACT1_POST (눈보라를 피한 뒤)  ── 3씬
   └─ onComplete → SceneEngine.start(ACT1B_BOOK.scenes, ...) 또는
                    Dispatcher.switchMode('v2_scene', {scene:'act1b_book'})

[v2_scene]  ACT1B_BOOK (하츄핑 전설서)  ── 4씬
   └─ onComplete → Dispatcher.switchMode('platformer', {next:'act2_escape'})
                    + STATE.storyFlags.act1_done = true
```

### 스토리 요약

**ACT1 — 로미의 아침**
1. 기상 (로미 혼자, 나레이션)
2. 꽁꽁핑 등장 ("로미니임~! 일어났어요?!")
3. 창밖의 눈 (로미가 꽁꽁핑 의심)
4. 꽁꽁핑 당황 자백 ("살~짝 불었는데… 세게 불었나 봐요")
5. **로미의 내적 동기**: 하츄핑이 나오는 꿈 → "꼭 만나야 해"
6. 눈보라 심해짐 → 지붕 타일 무너짐 → 미니게임 트리거

**ACT1_POST — 눈보라를 피한 뒤**
1. "후… 끝났다" 휴식
2. 책상 위 빛나는 「하츄핑 전설서」 발견
3. 결심 (책을 집어 든다)

**ACT1B_BOOK — 하츄핑 전설서**
1. 1장: 금단의 숲, 분홍빛 심장의 아이
2. 2장: "짝꿍"만이 하츄핑을 볼 수 있다
3. 3장 경고: 성 기사·얼어붙은 거리·특급버스·외로운 티니핑들…
4. 결심: "하츄핑을 만나러 갈래" → 꽁꽁핑 합류 → Act2 트리거

---

## 6. Dispatcher 연동 (Foundation 구현 대기 사항)

Foundation 담당 `Dispatcher.switchMode` 가 `onEnter(opts)` 로 씬 이름을 넘겨주면,
엔진이 해당 전역 스토리 객체(`ACT1`, `ACT1_POST`, `ACT1B_BOOK`)에서 씬 배열을 꺼내서 start.

권장 패턴 (Foundation 측에서):

```js
// pseudo
const STORY_MAP = {
  act1_morning:    () => window.ACT1,
  act1_post_dodge: () => window.ACT1_POST,
  act1b_book:      () => window.ACT1B_BOOK
};

function enterV2Scene(storyId){
  const story = STORY_MAP[storyId]();
  window.SceneEngine.start(story.scenes, () => {
    // onComplete 처리
    const oc = story.onComplete || {};
    Object.assign(window.STATE.storyFlags, oc.setFlags || {});
    if(oc.triggerMode){
      window.Dispatcher.switchMode(oc.triggerMode, {
        returnTo: oc.returnTo,
        next:     oc.next
      });
    }
  });
}
```

엔진 자체는 **onComplete 필드만 담고 있고**, 실제 모드 전환은 Dispatcher/Foundation이 처리.

---

## 7. 검증 체크리스트

- [ ] `Dispatcher.switchMode('v2_scene')` + `SceneEngine.start(ACT1.scenes, cb)` → Act1 첫 씬이 렌더된다
- [ ] 타이핑이 30ms/char 로 흘러가고, 탭하면 즉시 완성된다
- [ ] 완성된 대사를 탭하면 다음 대사로 넘어간다
- [ ] 씬 마지막 대사를 탭하면 다음 씬(또는 onComplete)으로 넘어간다
- [ ] Enter/Space 로도 동일하게 진행된다
- [ ] `window.IM.bg_castle` 이 로드 안 되어도 그라데이션 배경으로 폴백된다
- [ ] `window.IM.rs` / `IM.kk` 없으면 이모지로 폴백된다
- [ ] 말하는 actor만 바운스·밝게, 상대는 디밍된다
- [ ] 나레이션일 때 이름 태그 없이 이탤릭으로 표시된다
- [ ] 전체 씬 소진 시 `onComplete()` 콜백 1회만 호출된다

---

## 8. 의존성 / 제약

- **사용**: `window.STATE`, `window.IM`, `window.SPRITE_KEY`, `window.UCanvas`
- **건드리지 않음**: `unified/core/*`, `unified/ui/canvas.js`, `hatcuping-unified.html`, v2/v3/게임 원본
- Foundation 준비 전에도 엔진 단독 테스트 가능:
  ```js
  const ctx = someCanvas.getContext('2d');
  window.SceneEngine.start(window.ACT1.scenes, () => console.log('done'));
  function loop(){ window.SceneEngine.update(); window.SceneEngine.render(ctx, 420, 750); requestAnimationFrame(loop); }
  loop();
  someCanvas.addEventListener('click', e => window.SceneEngine.handleInput(0,0,'tap'));
  ```
