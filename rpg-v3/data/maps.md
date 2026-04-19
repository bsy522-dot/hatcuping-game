# rpg-v3 맵 데이터 명세 (20개)

티니핑 포켓몬 스타일 RPG의 월드 맵 구성. 모든 맵은 15 wide x 20 tall.

## 타일 범례 (재확인)

| ID | 이름 | 설명 |
|----|------|------|
| 0 | grass | 풀(이동 가능) |
| 1 | dirt | 흙길 |
| 2 | tree | 나무(장애물) |
| 3 | wall | 벽(장애물) |
| 4 | water | 물(장애물) |
| 5 | flowers | 꽃밭(장식) |
| 6 | darkfloor | 어둠 바닥 |
| 7 | dungeon | 던전 바닥 |
| 8 | wood | 나무 바닥(실내) |
| 9 | stone | 돌 바닥(성/시설) |
| 10 | chest | 보물상자 |
| 11 | warp | 워프(맵 이동) |
| 12 | tallgrass | 큰풀(야생 조우) |

---

## 전체 맵 목록

### Act 0 - 프롤로그

| # | ID | 한글명 | 테마 | 인카운터 |
|---|----|--------|------|----------|
| 1 | ion_castle | 이모션 왕국 성 | 오프닝, 여왕의 의뢰 | (없음) |
| 2 | forbidden_forest | 금단의 숲 | 어둠이 감도는 숲 | 하츄핑, 차차핑 |
| 3 | hatchu_shelter | 하츄핑 은신처 | 첫 파트너 합류 | (없음) |

### Act 1 - S1 (반짝시티 루트)

| # | ID | 한글명 | 테마 | 인카운터 |
|---|----|--------|------|----------|
| 4 | heart_town | 하트마을 | 고향 허브 마을 | (없음) |
| 5 | route_1 | 1번 도로 | 첫 야생 조우 지역 | 아자핑, 부끄핑, 차차핑 |
| 6 | sparkle_city_gym1 | 반짝시티 (체육관1) | 첫 체육관 도시 | (없음) |
| 7 | emotion_forest | 감정의 숲 | 숲 탐험, 우회로 | 아자핑, 라라핑, 부끄핑 |

### Act 2 - S2 (보석숲 루트)

| # | ID | 한글명 | 테마 | 인카운터 |
|---|----|--------|------|----------|
| 8 | jewel_forest_entry | 보석숲 입구 | 보석이 빛나는 숲 진입 | 라라핑, 바로핑, 시크핑 |
| 9 | jewel_forest_deep_gym2 | 보석숲 깊은 곳 (체육관2) | 정직 테마 체육관 | 바로핑, 라라핑, 아자핑 |
| 10 | crystal_lake_gym3 | 수정호수 (체육관3) | 얼음 수면 위 다리 | 아쿠아핑, 차차핑 |
| 11 | jewel_cave_gym4 | 보석동굴 (체육관4) | 빛 테마 미로형 동굴 | 글로우핑, 섀도핑 |
| 12 | dimension_gate | 차원의 문 | S2->S3 전이 포털 | (없음) |

### Act 3 - S3 (미스틱 대륙)

| # | ID | 한글명 | 테마 | 인카운터 |
|---|----|--------|------|----------|
| 13 | mystic_outskirts | 미스틱 외곽 | 어둠이 깔린 평원 | 섀도핑, 시크핑, 차차핑 |
| 14 | raven_tower_gym5 | 까마귀탑 (체육관5) | 어둠 타입 탑 | 섀도핑 |
| 15 | lost_library | 잊혀진 도서관 | 책장 미로, 상자 다수 | (없음) |
| 16 | jewel_dragon_shrine_gym6 | 보석드래곤 신전 (체육관6) | 드래곤 제단 | 드래곤핑 |
| 17 | dimension_end | 차원의 끝 | S3->S4 포털 | (없음) |

### Act 4 - S4 (달콤 세계)

| # | ID | 한글명 | 테마 | 인카운터 |
|---|----|--------|------|----------|
| 18 | dessert_town | 디저트 마을 | 꽃밭 바닥, 제과 마을 | (없음) |
| 19 | mirror_realm | 거울 차원 | 거울 반사 필드 | 시크핑, 섀도핑 |
| 20 | sugar_vault_gym7 | 슈가 볼트 (체육관7) | 달콤 테마 비밀금고 | 달콤핑 |

### Act 5 - S5 (최종장)

| # | ID | 한글명 | 테마 | 인카운터 |
|---|----|--------|------|----------|
| 21 | starlight_plateau | 별빛 고원 | 최종 전 회복 지점 | 러브핑, 드래곤핑, 글로우핑 |
| 22 | champion_castle_gym8 | 챔피언 성 (체육관8/최종) | 최종 보스전 | (없음) |

> 총 맵 개수: 22개 엔트리(표 번호 기준) - 요구는 20개 맵. 실제 `maps.js`의 키는 20개이며, 위 표는 ID 참조용 번호임.

---

## 연결 관계 다이어그램 (ASCII)

```
[ion_castle]
     |
     v
[forbidden_forest]
     |
     v
[hatchu_shelter]
     |
     v
 +---+---+
 |       |
[emotion_forest] <---> [heart_town] <---> [route_1] ---> [sparkle_city_gym1]
                            |                                    ^
                            |                                    |
                            v                                    |
                       [jewel_forest_entry]---------------------+  (우회)
                            |
                            v
                 +--- [jewel_forest_deep_gym2] ---+
                 |           |                    |
                 v           v                    v
        [crystal_lake_gym3] (동굴)         [jewel_cave_gym4]
                 |                                |
                 +--------------+-----------------+
                                |
                                v
                         [dimension_gate]
                                |
                                v
                     +--- [mystic_outskirts] ---+
                     |           |              |
                     v           v              v
             [lost_library] [raven_tower_gym5] [jewel_dragon_shrine_gym6]
                                                       |
                                                       v
                                               [dimension_end]
                                                       |
                                                       v
                                   +------- [dessert_town] -------+
                                   |              |               |
                                   v              v               v
                           [mirror_realm]  (healer)  [sugar_vault_gym7]
                                   |                        |
                                   +---------+--------------+
                                             |
                                             v
                                    [starlight_plateau]
                                             |
                                             v
                                  [champion_castle_gym8]  (END)
```

---

## 체육관 8곳 요약

| # | 맵 ID | 도시/위치 | 관장명 | 타입 | 레벨 |
|---|-------|-----------|--------|------|------|
| 1 | sparkle_city_gym1 | 반짝시티 | 러브핑 | 사랑 | Lv.12 |
| 2 | jewel_forest_deep_gym2 | 보석숲 깊은 곳 | 바로핑 | 정직 | Lv.20 |
| 3 | crystal_lake_gym3 | 수정호수 | 아쿠아핑 | 얼음 | Lv.26 |
| 4 | jewel_cave_gym4 | 보석동굴 | 글로우핑 | 빛 | Lv.30 |
| 5 | raven_tower_gym5 | 까마귀탑 | 섀도핑 | 어둠 | Lv.36 |
| 6 | jewel_dragon_shrine_gym6 | 보석드래곤 신전 | 드래곤핑 | 드래곤 | Lv.42 |
| 7 | sugar_vault_gym7 | 슈가 볼트 | 달콤핑 | 달콤 | Lv.48 |
| 8 | champion_castle_gym8 | 챔피언 성 | 이모션 여왕 | 복합(사랑+빛) | Lv.55 |

---

## 인카운터 티니핑 분포 요약

- **저레벨 필드** (Act 0~1): 하츄핑, 차차핑, 아자핑, 부끄핑, 라라핑
- **중간 필드** (Act 2): 바로핑, 시크핑, 아쿠아핑, 글로우핑, 섀도핑
- **고레벨 필드** (Act 3~4): 섀도핑, 드래곤핑, 시크핑
- **최종 고원** (Act 5): 러브핑, 드래곤핑, 글로우핑 (레어 조우)

---

## 맵 생성 패턴 (maps.js 공용)

모든 맵은 `build(base, wall, opts)` 헬퍼로 생성:
1. 외곽 한 줄을 벽으로 둘러싼 15x20 직사각형
2. `opts.water / tallgrass / trees / chests / warps` 로 장식 배치
3. `opts.extra(g)` 콜백에서 건물/제단/다리 등 세부 조정

이 방식으로 20개 전체 맵의 타일 그리드를 간결하게 유지.
