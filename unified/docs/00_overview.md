# 사랑의 하츄핑 UNIFIED v4 — 전체 개요

## 비전
영화 "사랑의 하츄핑" 서사를 3가지 장르 게임플레이를 **한 편의 게임**으로 엮어 재현한다.

- **v2 대화형 RPG** — 카톡 스타일 다이얼로그 컷씬
- **마리오식 플랫포머** — 점프/회피/러닝 액션
- **v3 포켓몬식 RPG** — 탐색 맵 + 턴제 전투

세 게임이 씬 단위로 매끄럽게 전환되며, 하나의 `STATE`를 공유한다.

## 핵심 혁신
**로미가 직접 전투한다.** 기존 버전에선 하츄핑이 주 전투원이었지만 v4에선 로미가 Lv.1(HP 50 / ATK 15 / DEF 10 / SPD 12)로 시작해 Act 진행에 따라 성장. 하츄핑을 비롯한 티니핑들은 파트너로서 돕되, **최종전(Act7)에서만 하츄핑이 직접 협력 전투**에 참여한다.

## 8 Act 구조

| Act  | 제목             | 모드             | 핵심 이벤트                         |
|------|------------------|------------------|-------------------------------------|
| 1    | 침실             | `v2_scene`       | 로미, 이온 성에서 아침. 도망 결심   |
| 1.5  | 눈 피하기         | `dodge`          | 근위병 시야 회피                    |
| 2    | 성 탈출          | `platformer`     | 벽타기/점프 탈출 스테이지           |
| 3    | 버스 러닝        | `run`            | 스크롤 러닝, 장애물 회피            |
| 4    | 마을 전투        | `v3_battle`      | 하츄핑과 조우, 첫 전투              |
| 5    | 탐색 & 캐치      | `v3_map`         | 포켓몬식 맵, 티니핑 모으기          |
| 6    | 트러핑 성        | `v3_map` + 전투  | 적진 잠입                            |
| 7    | 최종전           | `v3_battle`      | 하츄핑 협력 전투                    |
| 8    | 엔딩             | `cutscene`       | 크레딧                              |

## 기술 스택
- 바닐라 JavaScript (번들러 없음, ES5-ish with const/let/arrow/optional chaining)
- Canvas 2D API 단독
- 420×750 논리 해상도 세로 모바일
- DPR 대응 자동 스케일
- 외부 의존성 0개 (폰트 Jua CDN만 사용)

## 폴더 구조
```
hatcuping/
├── hatcuping-unified.html         ← 진입점 (Foundation)
├── sprites_data.js                 ← (기존) 캐릭터 스프라이트
├── env_backgrounds.js              ← (기존) 배경 이미지
└── unified/
    ├── core/
    │   ├── state.js                ← window.STATE
    │   ├── mode_dispatcher.js      ← window.Dispatcher
    │   └── save.js                 ← window.UnifiedSave
    ├── ui/
    │   └── canvas.js               ← window.UCanvas (DPR)
    ├── engines/                    ← 각 모드 엔진 (다른 팀)
    ├── story/                      ← Act별 스크립트 (다른 팀)
    ├── data/                       ← 티니핑 도감, 맵 등
    └── docs/
        ├── 00_overview.md          ← 본 문서
        └── 02_mode_dispatcher.md   ← 모드 시스템
```

## 글로벌 네임스페이스

| 글로벌             | 정의 파일               | 용도                         |
|--------------------|-------------------------|------------------------------|
| `window.STATE`     | core/state.js           | 게임 전역 상태               |
| `window.Dispatcher`| core/mode_dispatcher.js | 모드 전환 & 프레임 위임      |
| `window.UnifiedSave`| core/save.js           | localStorage 세이브          |
| `window.UCanvas`   | ui/canvas.js            | Canvas + DPR 관리            |
| `window.IM`        | hatcuping-unified.html  | 프리로드된 이미지 맵         |
| `window.FN(size)`  | hatcuping-unified.html  | 폰트 폴백 헬퍼               |
| `window.FRAME_T`   | hatcuping-unified.html  | 전역 프레임 카운터           |

## 검증 상태 (Foundation)
- `hatcuping-unified.html` 로드 시 검은 배경 + 로딩 바 → 플레이스홀더 "mode: v2_scene" 화면
- 콘솔 에러 0
- 엔진 미구현 모드 호출 시 안전 플레이스홀더 표시
- 기존 rpg-v3/, hatcuping-rpg-v2.html, hatcuping-game.html 건드리지 않음

## 제약 (절대 준수)
1. 기존 `rpg-v3/` 폴더 수정 금지
2. 기존 `hatcuping-rpg-v2.html`, `hatcuping-game.html` 수정 금지
3. 신규 코드는 `unified/` 또는 `hatcuping-unified.html`에만 추가
