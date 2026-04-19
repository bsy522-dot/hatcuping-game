# rpg-v3 UI 모듈 인덱스

Canvas 2D 기반 vanilla JS UI 모듈 모음. 모두 `window` 글로벌에 부착되어 DOM 없이 동작.

## 캔버스 규격

- 420 × 750 (모바일 세로)
- 단일 Canvas 2D context를 각 draw 함수에 전달

## 컬러 팔레트

| 용도 | HEX | 이름 |
|------|------|------|
| 메인 강조 | `#FF6B9D` | 핑크 |
| 포인트 | `#FFD54F` | 옐로 |
| HP/성공 | `#66BB6A` | 그린 |
| EXP/물 | `#4FC3F7` | 블루 |
| 배경/텍스트 | `#2a1540` | 어두운 보라 |
| 카톡 내 말풍선 | `#FEE500` | 카톡 옐로 |

## 모듈

| 파일 | 글로벌 | 설명 |
|------|--------|------|
| `katok_dialog.js` | `KatokDialog` | 카톡 스타일 대화창, 타이핑 효과 |
| `hud.js`          | `HUD`          | 전투/맵 HUD + 미니맵 |
| `menu.js`         | `Menu`         | 도감/가방/티니핑/저장 4탭 |
| `title_screen.js` | `TitleScreen`  | 타이틀 + 하트 파티클 |
| `battle_ui.js`    | `BattleUI`     | 전투 커맨드/스킬/가방/포획 |

각 모듈 문서: `katok_dialog.md`, `hud.md`, `menu.md`, `title_screen.md`, `battle_ui.md`.

## 로딩 순서 (권장)

```html
<script src="ui/hud.js"></script>
<script src="ui/katok_dialog.js"></script>
<script src="ui/menu.js"></script>
<script src="ui/battle_ui.js"></script>
<script src="ui/title_screen.js"></script>
```

모듈 간 결합:
- `Menu` → `window.Pokedex.render` 존재 시 위임
- `TitleScreen` → `window.SaveGame.exists()` 또는 `localStorage.hatcuping_save` 체크

## 공통 패턴

- `draw(ctx, W, H)` 시그니처 통일
- 내부 state는 모듈 IIFE에 캡슐화
- 탭 입력은 각 모듈의 `handleClick` / `handleInput`이 반환값으로 소비 여부 알림
- 텍스트는 모두 한글 기본, 이모지로 아이콘 대체 (스프라이트 추가 시 확장)

## 원작 참고

- 카톡풍: 로미가 티니핑 동료와 주고받는 연출 오마주
- 포켓몬식 HUD: HP/EXP 가로바, 배지 8개, 4커맨드
- 티니핑 마을 위치명을 맵 HUD 하단에 표시
