# 04. 에셋 매니페스트

> 이 문서의 목적: UNIFIED v4에서 재사용하는 기존 에셋, 신규로 필요한 에셋(플레이스홀더 전략 포함), 사운드, Act별 필요 에셋 체크리스트를 정리한다.

---

## 1. 기존 재사용 에셋 (무변경)

### 1-1. 캐릭터 스프라이트 (`rpg-v3/data/sprites_data.js`)

| ID | 캐릭터 | 용도 | 사용 Act |
|---|---|---|---|
| `ROMI_S` | 로미 (기본) | 플레이어 캐릭터 | 1~8 |
| `ROMI_P` | 로미 (포즈 변형) | 컷신·전투 | 2, 4~7 |
| `HATCHU_S` | 하츄핑 (기본) | 파트너/조우 | 5~8 |
| `HATCHU_P` | 하츄핑 (포즈 변형) | Act7 각성·엔딩 | 7, 8 |
| `BARO_S` | 바로핑 | 포획·서포트 | 5 |
| `CHACHA_S` | 차차핑 | 포획·서포트 | 5 |
| `KKONG_S` | 꽁꽁핑 | 포획·서포트 | 5 |
| `BUKKU_S` | 부끄핑 | 포획·서포트 | 5 |
| `TRUP_S` | 트러핑 (기본) | 보스 | 7 |
| `LALA_S` | 라라핑 | 마을 NPC | 4, 5 |
| `LIAM_S` | 리암 왕자 | 파티 합류 | 4~7 |
| `MONJU_S` | 몬쥬 | NPC (+할머니 베이스) | 1, 2 |
| `STICK_S` | 스틱 NPC | 배경 인물 | 4, 5 |
| `HK_F` | 해핑 | 첫 전투 적 | 4 |

### 1-2. 배경 (`rpg-v3/data/env_backgrounds.js`)

| ID | 장소 | 사용 Act |
|---|---|---|
| `BG_CASTLE_INTERIOR` | 성 내부 (로미 침실 포함) | 1, 2 |
| `BG_CASTLE_CORRIDOR` | 성 복도 | 2 |
| `BG_CASTLE_ROOF` | 성 지붕 (보스전) | 2 |
| `BG_FOUNTAIN_PLAZA` | 분수 광장 | 3 |
| `BG_FOREST_BRIGHT` | 밝은 숲 | 4, 5 |
| `BG_FOREST_DEEP` | 깊은 숲 | 5 |
| `BG_FOREST_DARK` | 어두운 숲 | 5, 6 |

---

## 2. 신규 필요 에셋 (플레이스홀더 전략)

기존 팀원 자원으로 먼저 게임을 성립시키고, 이후 아트 리소스로 교체하는 전략.

### 2-1. 신규 캐릭터

| 필요 대상 | Act | 1차 플레이스홀더 | 2차 (정식) |
|---|---|---|---|
| 할머니 | 2 (컷신) | `MONJU_S` 팔레트 스왑 (머리 흰색) 또는 👵 이모지 64px | 신규 스프라이트 |
| 마리 (친구) | 4 | `ROMI_S` 팔레트 스왑 (옷 파랑) 또는 🧒 이모지 | 신규 스프라이트 |
| 버스 아저씨 | 3 | 🚌 + 👨 이모지 조합 | 신규 스프라이트 |
| 성기사 (보스) | 2 | `LIAM_S` + 갑옷 오버레이 (회색 반투명 박스) | 신규 스프라이트 |
| 트러핑 실루엣 | 3 (꿈), 6 | `TRUP_S` + 검정 필터(`filter: brightness(0)`) | 신규 실루엣 아트 |

### 2-2. 신규 오브젝트/이펙트

| 필요 대상 | Act | 1차 플레이스홀더 | 비고 |
|---|---|---|---|
| 버스 차체 | 3 | Canvas 직사각형 200×80 + 바퀴(원 2개) | 애니메이션: 바퀴 회전 |
| 눈송이 파티클 | 1.5 | Canvas ❄️ 렌더 또는 작은 흰 원 | 중력·흔들림 |
| 낙하물 (Act6) | 6 | 회색 돌 이모지 🪨 또는 Canvas 사각형 | 별빛대모험식 |
| 하트 이펙트 (포획) | 5, 8 | Canvas ♥ 그라디언트 | 핑크 그라디언트 |
| 합체기 컷인 (Act7) | 7 | 핑크 방사형 그라디언트 + 텍스트 오버레이 | 3초 연출 |

### 2-3. 팔레트 스왑 가이드

`CanvasRenderingContext2D.globalCompositeOperation = 'source-atop'` 사용하여 기존 스프라이트 위에 색상 오버레이:

```javascript
function tintSprite(ctx, baseSprite, tintColor) {
  ctx.drawImage(baseSprite, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = tintColor;
  ctx.fillRect(0, 0, baseSprite.width, baseSprite.height);
  ctx.globalCompositeOperation = 'source-over';
}
```

---

## 3. 사운드 (WebAudio 생성)

외부 사운드 파일 없이 `AudioContext`로 생성. `unified/core/audio.js`에서 제공 예정.

| ID | 용도 | 파라미터 |
|---|---|---|
| `damage` | 피격 | 사각파 80Hz, 0.1초, 감쇠 |
| `victory` | 전투 승리 | 도-미-솔 아르페지오, 0.6초 |
| `levelUp` | 레벨업 | 솔-도 상승, 반짝 노이즈 |
| `captureOk` | 포획 성공 | 벨 톤 660Hz, 에코 |
| `captureFail` | 포획 실패 | 저역 200Hz 하강 |
| `menuClick` | UI 클릭 | 짧은 사인파 440Hz, 0.05초 |
| `battleStart` | 전투 시작 | 붐 120Hz + 팡파레 0.4초 |

### 볼륨 정책
- 마스터 볼륨 기본 0.6
- BGM 없음 (미니멀 전략) → 이펙트만
- 음소거 버튼 UI 우상단 고정

---

## 4. Act별 필요 에셋 체크리스트

### Act1: 로미 침실 기상
- [ ] `ROMI_S`, `MONJU_S` (엄마 역)
- [ ] `BG_CASTLE_INTERIOR`
- [ ] 사운드: `menuClick`

### Act1.5: 눈피하기
- [ ] `ROMI_S`
- [ ] 눈송이 파티클 (신규 Canvas)
- [ ] 사운드: `damage`

### Act2: 성탈출 + 보스 + 컷신
- [ ] `ROMI_S`, `ROMI_P`, `LIAM_S` (성기사 베이스)
- [ ] 할머니 (MONJU_S 팔레트 스왑)
- [ ] `BG_CASTLE_CORRIDOR`, `BG_CASTLE_ROOF`
- [ ] 사운드: `damage`, `victory`, `battleStart`

### Act3: 오버월드 + 버스러닝 + 꿈
- [ ] `ROMI_S`
- [ ] 버스 아저씨 (이모지), 버스 차체 (Canvas)
- [ ] 트러핑 실루엣 (TRUP_S 필터)
- [ ] `BG_FOUNTAIN_PLAZA`
- [ ] 사운드: `menuClick`, `victory`

### Act4: 마을 + 해핑 전투 + 리암 합류
- [ ] `ROMI_S`, `LALA_S`, `LIAM_S`, `HK_F`
- [ ] 마리 (ROMI_S 팔레트 스왑)
- [ ] `BG_FOREST_BRIGHT`
- [ ] 사운드: `battleStart`, `damage`, `victory`, `levelUp`

### Act5: 티니핑 탐색 + 하츄핑 조우
- [ ] `ROMI_S`, `LIAM_S`, `HATCHU_S`
- [ ] `BARO_S`, `CHACHA_S`, `KKONG_S`, `BUKKU_S`
- [ ] `BG_FOREST_BRIGHT`, `BG_FOREST_DEEP`, `BG_FOREST_DARK`
- [ ] 하트 이펙트 (포획 연출)
- [ ] 사운드: `battleStart`, `captureOk`, `captureFail`, `victory`

### Act6: 트러핑 성 탈출
- [ ] `ROMI_S`, `HATCHU_S`
- [ ] 트러핑 실루엣
- [ ] 낙하물 (Canvas)
- [ ] `BG_FOREST_DARK` (성 외곽 재활용)
- [ ] 사운드: `damage`

### Act7: 최종 보스 트러핑 (2인 협력)
- [ ] `ROMI_S`, `ROMI_P`, `HATCHU_S`, `HATCHU_P`, `TRUP_S`
- [ ] 합체기 컷인 (신규 Canvas 연출)
- [ ] `BG_CASTLE_ROOF` (재활용)
- [ ] 사운드: `battleStart`, `damage`, `victory`, `captureOk`

### Act8: 엔딩 컷신
- [ ] `ROMI_P`, `HATCHU_P`, 전 파티
- [ ] 영화 오마주 장면 (정적 이미지 연출)
- [ ] 사운드: `victory`

---

## 5. 에셋 로딩 전략

- **Preload**: Act1 시작 전 `ROMI_S`, `HATCHU_S`, `MONJU_S`, `BG_CASTLE_INTERIOR` 프리로드
- **Lazy Load**: Act별 진입 직전 필요 에셋 로드
- **캐시**: ServiceWorker에서 스프라이트 1년 캐시, 버전 bump로 무효화
