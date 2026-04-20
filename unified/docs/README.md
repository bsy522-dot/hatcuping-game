# UNIFIED v4 — 문서 인덱스

> 이 문서의 목적: 사랑의 하츄핑 UNIFIED v4 프로젝트에 처음 합류한 사람이 **어떤 문서를 어떤 순서로 읽어야 하는지** 안내한다.

---

## 프로젝트 한 줄 요약

**v2 대화엔진 + v3 RPG + 플랫포머**를 하나의 `hatcuping-unified.html`로 통합한 **3게임 융합 프로젝트**. 8 Act 구성, 로미가 주인공으로 직접 싸우며, Act7 최종전에서만 하츄핑과 2인 협력.

---

## 읽는 순서 (처음 오는 사람)

### 1단계: 전체 그림 (15분)
1. **[00_overview.md](./00_overview.md)** — 프로젝트 전체 개요, 기술 스택, 폴더 구조
2. **[01_act_flow.md](./01_act_flow.md)** — 8 Act 흐름도, 각 Act 트리거/전환 조건, 골든패스 체크리스트

### 2단계: 핵심 시스템 (30분)
3. **[03_romi_battle_system.md](./03_romi_battle_system.md)** — 로미 전투 철학, 스탯 곡선, 4 감정 스킬, 파트너 서포트, Act7 합체기

### 3단계: 구현 준비 (20분)
4. **[04_asset_manifest.md](./04_asset_manifest.md)** — 재사용 에셋 목록, 신규 필요 에셋 (플레이스홀더 전략), Act별 체크리스트

### 4단계: 품질 관리 (15분)
5. **[09_qa_plan.md](./09_qa_plan.md)** — Puppeteer 골든패스 테스트, 회귀 diff 체크, 성능/호환 기준, 배포 체크리스트

---

## 문서 인덱스 (전체)

| 번호 | 파일 | 한 줄 요약 | 담당 영역 |
|---|---|---|---|
| 00 | [00_overview.md](./00_overview.md) | 프로젝트 전체 개요 | Foundation |
| 01 | [01_act_flow.md](./01_act_flow.md) | 8 Act 플로우 · 골든패스 | Story/Flow |
| 02 | (예정) `02_engine_api.md` | 7개 엔진 인터페이스 (Scene/Platformer/Dodge/Run/V3Map/V3Battle/Cutscene) | Engines |
| 03 | [03_romi_battle_system.md](./03_romi_battle_system.md) | 로미 전투 · 스킬 · 파트너 · 합체기 | Battle |
| 04 | [04_asset_manifest.md](./04_asset_manifest.md) | 에셋 재사용/신규/사운드 | Assets |
| 05 | (예정) `05_dialog_scripts.md` | Act별 대사 스크립트 | Writing |
| 06 | (예정) `06_ui_layout.md` | UI 레이아웃 (420×750) | UI |
| 07 | (예정) `07_save_system.md` | 세이브/체크포인트 구조 | Persistence |
| 08 | (예정) `08_audio_spec.md` | WebAudio 사운드 생성 스펙 | Audio |
| 09 | [09_qa_plan.md](./09_qa_plan.md) | QA 자동화 · 회귀 · 성능 · 배포 | QA |

---

## 폴더 구조 요약

```
unified/
├── core/          # Dispatcher, 전역 STATE, 유틸
├── engines/       # 7종 엔진 (Scene/Platformer/Dodge/Run/V3Map/V3Battle/Cutscene)
├── story/         # Act1~Act8 시나리오 스크립트
├── ui/            # 공통 UI 컴포넌트
├── data/          # 스탯/스킬/티니핑/레벨 테이블
└── docs/          # (이 폴더) 설계 문서
```

---

## 역할별 추천 읽기

| 역할 | 필수 읽기 |
|---|---|
| 신규 합류 개발자 | 00 → 01 → 03 → 04 |
| 스토리 작가 | 00 → 01 → 05(예정) |
| 아트/에셋 담당 | 00 → 04 → 06(예정) |
| QA 엔지니어 | 01 → 09 |
| PM/기획자 | 00 → 01 → 09 |
| 사운드 디자이너 | 04 §3 → 08(예정) |

---

## 동시 진행 에이전트 (2026-04-20 기준)

현재 복수 에이전트가 병렬 작업 중. 다른 에이전트의 구체적 구현은 **"예정된 API"** 수준으로 참조하되 직접 의존 금지.

| 에이전트 | 담당 | 산출물 예상 |
|---|---|---|
| Foundation | `core/`, `dispatcher.js`, 전역 STATE | `00_overview.md` 후속 |
| Act1 | Scene 엔진 + v2 대화 통합 | `engines/scene.js` |
| Act1.5 | Dodge 엔진 | `engines/dodge.js` |
| Act2 | Platformer + 보스 | `engines/platformer.js` |
| **Docs (본 에이전트)** | 문서 5종 | 01, 03, 04, 09, README |

---

## 기여 규칙

1. 기존 게임 파일 (`hatcuping-game.html`, `hatcuping-rpg.html`, `rpg-v3/`, `rpg-v2/`) **수정 금지**
2. 신규 작업은 `unified/` 폴더 내부에만
3. 문서 수정 시 PR에서 관련 md 파일명 표기
4. 에셋 교체 시 `04_asset_manifest.md`에 반영
5. 새 Act/기능 추가 시 `01_act_flow.md` 체크리스트 업데이트
6. QA 기준 미달 시 배포 금지 (`09_qa_plan.md` 참조)

---

## 이력

| 날짜 | 작성자 | 내용 |
|---|---|---|
| 2026-04-20 | Docs 에이전트 | 01, 03, 04, 09, README 초판 작성 |
