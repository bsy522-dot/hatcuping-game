# 사랑의 하츄핑 RPG v3 — 원작 완전판

> 캐치!티니핑 시즌 1~5 + 극장판 "사랑의 하츄핑" 전편을 하나의 포켓몬 레드 스타일 RPG로 재구성.

## 핵심 특징

- **6 Act 구조** (시즌별 1 Act): 극장판→S1→S2→S3→S4→S5
- **티니핑 도감 41종** (로열 12 / 일반 20 / 빌런 6 / 레전드 3)
- **체육관 8개**: 바로핑/아자핑/꽁꽁핑/차차핑/레이븐/보석드래곤/파티시에/챔피언
- **라이벌 제니** 2회 등장 (S2 1차전, S3 최종 2페이즈전)
- **진화 시스템**: 일반→로열 각성 (보석드래곤 축복 필요)
- **카톡풍 대화 UI** + SNS 프로필 도감
- **엔딩 2종**: Act3 정사 엔딩A, Act5 진엔딩B

## 폴더 구조

```
rpg-v3/
├── index.html              # 메인 게임 (캔버스 420×750)
├── README.md               # 이 파일
├── data/                   # 게임 데이터
│   ├── tiniping_dex.js     # 티니핑 41종 도감
│   ├── tiniping_dex.md
│   ├── types.js            # 10 감정 타입 상성표
│   ├── maps.js             # 20개 맵 그리드
│   └── maps.md
├── story/                  # 6 Act 대사/시나리오
│   ├── act0_prologue.js    # 극장판: 하츄핑 마음열기
│   ├── act1_scatter.js     # S1: 지구로 흩어진 티니핑
│   ├── act2_jewel.js       # S2: 보석숲 + 제니 1차전
│   ├── act3_mystic.js      # S3: 미스틱마을 + 최종전 + 엔딩A
│   ├── act4_dessert.js     # S4: 거울차원 디저트
│   ├── act5_star.js        # S5: 슈팅스타 + 진엔딩B
│   └── README.md
├── systems/                # 게임 로직
│   ├── battle.js           # 턴제 전투 엔진
│   ├── capture.js          # 포획 (하트 소모)
│   ├── evolution.js        # 진화 (각성)
│   ├── pokedex.js          # 도감 4탭
│   ├── save.js             # localStorage
│   ├── party.js            # 6파티 + 무제한 박스
│   ├── gym.js              # 체육관 8개 + 배지
│   └── README.md
├── ui/                     # 그리기 모듈
│   ├── katok_dialog.js     # 카톡 말풍선
│   ├── hud.js              # 전투/맵 HUD
│   ├── menu.js             # 4탭 하단메뉴
│   ├── title_screen.js     # 타이틀 화면
│   ├── battle_ui.js        # 전투 커맨드
│   └── README.md
└── docs/                   # 추가 문서
```

## 실행

부모 폴더 `hatcuping/index.html` 런처에서 **"RPG v3 원작 완전판"** 카드 클릭.

직접 열기: `rpg-v3/index.html`을 브라우저에 드래그.

## 모듈 로드 순서 (index.html)

1. 에셋: `../sprites_data.js`, `../env_backgrounds.js` (부모 재사용)
2. 데이터: `types → dex → maps`
3. 스토리: `act0~5`
4. 시스템: `save → party → battle → capture → evolution → pokedex → gym`
5. UI: `katok_dialog → hud → menu → battle_ui → title_screen`

## 전역 객체

| 네임스페이스 | 내용 |
|---|---|
| `window.TINIPING_DEX` | 41종 배열 |
| `window.TYPE_CHART` | 상성표 |
| `window.MAPS` | 맵 20개 |
| `window.ACT0..ACT5` | 각 Act 시나리오 |
| `window.Battle / Capture / Evolution / Pokedex / Gym / Party / SaveGame` | 시스템 |
| `window.KatokDialog / HUD / Menu / TitleScreen / BattleUI` | UI |

## 원작 캐논 출처

- [나무위키 캐치!티니핑 시리즈](https://namu.wiki/w/%EC%BA%90%EC%B9%98!%20%ED%8B%B0%EB%8B%88%ED%95%91%20%EC%8B%9C%EB%A6%AC%EC%A6%88)
- [나무위키 사랑의 하츄핑 (극장판)](https://namu.wiki/w/%EC%82%AC%EB%9E%91%EC%9D%98%20%ED%95%98%EC%B8%84%ED%95%91)
- [나무위키 제니 (빌런)](https://namu.wiki/w/%EC%A0%9C%EB%8B%88(%EC%BA%90%EC%B9%98!%20%ED%8B%B0%EB%8B%88%ED%95%91%20%EC%8B%9C%EB%A6%AC%EC%A6%88))

## 저작권

개인 학습/비상업 목적. 티니핑 IP는 SAMG엔터테인먼트 소유.

## 현재 상태 (2026-04-18)

- ✅ 데이터 레이어 (도감/타입/맵) 완성
- ✅ 스토리 레이어 6 Act 대사 완성
- ✅ 시스템 모듈 7개 완성
- ✅ UI 모듈 5개 완성
- ⏳ 모듈 통합 (현재 index.html은 v2 엔진 + v3 모듈 로드 상태)
- ⏳ v3 타이틀→Act0 연결 (다음 단계)
- ⏳ 스프라이트 41종 확장 (현재 9종 팔레트 스왑)
