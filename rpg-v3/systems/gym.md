# gym.js - 감정 체육관

## Purpose
8감정 체육관 리더 파티 구성 및 배지 지급. 배지 수에 따라 Act 해금.

## API

| Method | Params | Returns | 설명 |
|---|---|---|---|
| `challenge(badge, opts)` | 배지명, `{baseLv?}` | `{ok, leader, party}` | 리더 파티 빌드 |
| `grantBadge(badge)` | 배지명 | bool | STATE.badges 추가 |
| `checkUnlock(actNo)` | 2/3/4 | `{unlocked, have, need}` | 액트 해금 |

## Constants
```js
BADGES  = ['사랑','정직','용기','여유','얼음','불','어둠','별']
LEADERS = 8 entries { badge, name, partyNames[], reward }
```

## Unlock 조건
| Act | 필요 배지 |
|---|---|
| Act2 | 2 |
| Act3 | 4 |
| Act4 (엔딩) | 6 |
| 최종 | 8 |

## Usage
```js
var c = Gym.challenge('사랑', { baseLv: 12 });
Battle.start(Party.getLeader(), c.party[0], {
  onVictory: function(){ Gym.grantBadge('사랑'); }
});
```

## 원작 매칭
원작의 "감정의 힘" 체계(사랑/정직/용기/여유 등)를 체육관 테마로 치환. 리더는 로미·제니 등 기존 인간 캐릭터 또는 오리지널 NPC.
