# 하츄핑 RPG v3 — 스토리 구조

원작 정사: **캐치! 티니핑 시즌 1~5 + 극장판 "사랑의 하츄핑"**
톤: 카톡풍 말풍선 UI, 현대 초등학생 말투, 이모지 활용

## Act 구조 요약

| Act | 시즌 | 제목 | 핵심 이벤트 | 씬 수 |
|-----|------|------|-------------|-------|
| 0 | 극장판 | 사랑의 하츄핑 | 10살 생일, 금단의 숲, 하츄핑 첫만남 (선택지 3회) | 6 |
| 1 | S1 | 흩어진 마음들 | 지구 도착, 바로핑 체육관, 하트킹 경고 | 6 |
| 2 | S2 | 보석숲의 그림자 | 3관장 (아자/꽁꽁/차차), 제니 1차전 | 6 |
| 3 | S3 | 차원의 끝에서 | 레이븐 하트윙, 보석드래곤, 제니 최종전 → **엔딩 A** | 8 |
| 4 | S4 | 달콤한 거울의 비밀 | 매직슈가볼, 거울차원, 파티시에, 레전드 달콤핑 | 6 |
| 5 | S5 | 별빛 너머의 나 | 행운핑/새콤핑, 미러매치 챔피언 → **엔딩 B (진엔딩)** | 7 |

## 원작 매칭

- **Act 0** ← 극장판 "사랑의 하츄핑" (2024) — 이모션 왕국, 금단의 숲, 하츄핑/로미 유대
- **Act 1** ← S1 "캐치! 티니핑" — 감정 티니핑 수집의 시작
- **Act 2** ← S2 "반짝반짝 캐치! 티니핑" — 보석숲 세계관, 제니 등장
- **Act 3** ← S3 "별빛 캐치! 티니핑" — 미스틱/고대 마법, 제니 서사 완결
- **Act 4** ← S4 "달콤 캐치! 티니핑" — 디저트 테마, 거울차원
- **Act 5** ← S5 "별꽃 캐치! 티니핑" — 별똥별/레전드 티니핑 집결

## unlockCondition 흐름도

```
new_game
   ↓
 [ACT 0] ──onComplete──▶ act1
   ↓
 [ACT 1] ──onComplete──▶ act2
   ↓
 [ACT 2] ──onComplete──▶ act3
   ↓
 [ACT 3] ──onComplete──▶ act4  +  triggerCredits: ending_a  ★ 엔딩 A
   ↓
 [ACT 4] ──onComplete──▶ act5
   ↓
 [ACT 5] ──onComplete──▶ newgame_plus + triggerCredits: ending_b_true  ★★ 엔딩 B (진엔딩)
```

## 엔딩 2종 조건

### 엔딩 A — "사랑으로 이긴 이야기"
- **조건**: Act 3 클리어 (제니 2페이즈 최종전 승리 + 제니 부모 재회)
- **플래그**: `ending_a_cleared`
- **보상**: 레이븐 하트윙, 제니 동료화, Act 4 해금
- **특징**: 정식 엔딩 스태프롤. 하지만 하늘엔 아직 별이 떨어진다 (Act 4 훅)

### 엔딩 B — "별빛 너머의 약속" (진엔딩)
- **조건**: Act 5 클리어 (미래의 로미 미러매치 챔피언전 3페이즈 승리)
- **플래그**: `ending_b_cleared`
- **보상**: 챔피언링, 레전드 4종 (하츄/달콤/행운/새콤), New Game+ 해금
- **특징**: 진엔딩 스태프롤. 제니 재회, 하트킹 공인, NG+ 모드 오픈

## 파일 구조

```
story/
├── act0_prologue.js    window.ACT0
├── act1_scatter.js     window.ACT1
├── act2_jewel.js       window.ACT2
├── act3_mystic.js      window.ACT3  (엔딩 A)
├── act4_dessert.js     window.ACT4
├── act5_star.js        window.ACT5  (엔딩 B)
└── README.md
```

## 공통 스키마

```js
window.ACTn = {
  id, title, season, unlockCondition, bgm,
  scenes: [
    { id, location, actors, dialog: [{who, text}, ...], choices?: [...] }
  ],
  onComplete: { addCharacter, unlock, giveItem, setFlag, triggerCredits? }
};
```

## 등장인물 등록 순서 (파티/도감)

1. Act 0 → **하츄핑** (필수 파트너)
2. Act 1 → **라라핑**
3. Act 2 → **아자핑** (+ 꽁꽁핑/차차핑 교류)
4. Act 3 → **제니** (개심 후 동료)
5. Act 4 → **달콤핑** (레전드 1)
6. Act 5 → **행운핑** (레전드 2, + 새콤핑)

## 톤 가이드

- 로미(10세 공주): `반말 + 💕🌸✨`, "헤헤", "야호", "가자!"
- 하트킹(아빠): 짧고 묵직함, "…자랑스럽구나"
- 몬쥬 박사: 존댓말 + "~에요", 리액션 많음
- 티니핑: 종족 말버릇 (바로핑=바로/아자핑=아자/차차핑=차차/달콤핑=달콤 등)
- 제니: 처음 차가움 → 후반 인간적 변화
- 내레이션(`who:'narration'`): 상황 묘사
