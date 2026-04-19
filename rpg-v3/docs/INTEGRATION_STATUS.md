# 통합 진행 상태 (최종)

## ✅ 완료 (2026-04-18)

### 파일 생성 (42개)
- `data/` : tiniping_dex(41종) + types + maps(22개)
- `story/` : act0~5 (6 Act)
- `systems/` : battle/capture/evolution/pokedex/save/party/gym (7개)
- `ui/` : katok_dialog/hud/menu/battle_ui/title_screen (5개)
- `docs/` : ARCHITECTURE, INTEGRATION_STATUS
- 각 모듈당 `.md` 문서

### STEP A~F 통합 완료
모두 `rpg-v3/index.html` 메인 엔진(inline script 420줄)에 반영.

| STEP | 구현 위치 | 상태 |
|---|---|---|
| **A. 타이틀 부팅** | `initTitle()`, `onTitleSelect()` | ✅ |
| **B. 스토리 엔진** | `startAct()`, `playScene()`, `finishAct()` | ✅ |
| **C. 맵 시스템** | `updateMap()`, `drawMap()`, 워프, 타일12 인카운터 | ✅ |
| **D. 전투** | `triggerWildBattle()` → Battle.start + Evolution.check | ✅ |
| **E. 체육관** | `interactNPC()` → npc.gym 감지 → Gym.challenge | ✅ |
| **F. 메뉴/도감** | STATE.scr='menu' → Menu.draw (Pokedex 위임) | ✅ |

## 실행 흐름

```
wait() [에셋 로드]
  └─ genTiles() + initTitle()
       └─ TitleScreen.draw (그라디언트+하트파티클+버튼)
            ├─ [새 게임] → onTitleSelect('new') → startAct(0)
            │                                        ↓
            │                                    playScene() (KatokDialog 대사)
            │                                        ↓
            │                                    finishAct() (보상, 맵 전환)
            │                                        ↓
            │                                    STATE.scr='map' → drawMap()
            │                                        ├─ 이동 (방향패드)
            │                                        ├─ 타일12 밟음 → triggerWildBattle()
            │                                        │      └─ Battle.start → drawBattle()
            │                                        ├─ NPC 근처+A → interactNPC()
            │                                        │      └─ Gym.challenge OR KatokDialog
            │                                        └─ 메뉴 → Menu.draw (도감/파티/저장)
            │
            └─ [이어하기] → SaveGame.load() → STATE.scr='map'
```

## 검증

- ✅ Node 문법 검증 21개 모듈 + 메인 inline script (19KB) 모두 통과
- ✅ 전역 객체: `TINIPING_DEX(41), MAPS(22), ACT0~5, Battle, Capture, Evolution, Pokedex, Gym, Party, SaveGame, KatokDialog, HUD, Menu, BattleUI, TitleScreen` 모두 로드
- ✅ API 시그니처 매칭 확인: TitleScreen.handleClick(x,y), KatokDialog.show(payload, onDone), Menu.draw(ctx,W,H,STATE) 등
- ✅ 부모 런처 index.html v3 카드 추가

## 알려진 한계 (후속)

| 항목 | 현재 | 계획 |
|---|---|---|
| 스프라이트 | 9종만 base64 존재 (하츄/바로/차차/꽁꽁/부끄/라라/스틱/트러/리암) | 41종 팔레트 스왑 or 신규 에셋 |
| 맵 NPC 배치 | data/maps.js 빌더 기본값, npc.gym 필드 미확인 | Gym.LEADERS와 맵 NPC 연결 검증 필요 |
| 스토리→맵 전환 위치 | 씬 location 이름이 MAPS ID와 일치하지 않을 수 있음 | 매핑 테이블 또는 정규화 필요 |
| 체육관 8개 실제 동작 | Gym.challenge 호출만 연결, 관장 파티 데이터 필수 | systems/gym.js LEADERS 확인 |
| 포획 UI | BattleUI.drawCapturePrompt 호출 경로 미연결 | 가방→하트 선택 분기 |
| BGM | 효과음 WebAudio만, BGM 루프 없음 | 선택적 |

## 브라우저에서 열 때 체크리스트

1. `rpg-v3/index.html` 직접 실행
2. 콘솔에 `[V3] 모듈 로드:` + `[V3] 엔진 부팅 완료` 두 줄 확인
3. 로딩바 지나면 타이틀 화면 (하트 파티클) 표시
4. [새 게임] 탭 → Act0 첫 씬 "로미 공주님! 드디어 오늘이에요 ✨" 표시
5. 탭으로 대사 진행 → 6씬 끝나면 맵 모드 진입
6. 방향패드로 이동 가능, 메뉴 버튼 동작 확인
