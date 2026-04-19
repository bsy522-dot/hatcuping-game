# pokedex.js - 티니핑 도감

## Purpose
4탭(로열/일반/빌런/레전드) 그리드 도감. 발견=실루엣, 포획=풀컬러. 상세패널에 6스탯 ASCII 바 표시.

## API

| Method | Params | Returns | 설명 |
|---|---|---|---|
| `markSeen(noOrId)` | number/string | void | 발견 표시 |
| `markCaught(noOrId)` | number/string | void | 포획 표시 (seen도 자동) |
| `render(tab)` | `'royal'\|'normal'\|'villain'\|'legend'` | HTML string | 탭+그리드 |
| `renderDetail(no)` | number | HTML string | 단일 상세 |
| `getEntry(noOrName)` | number/string | species | TINIPING_DEX 조회 |
| `getStats(species)` | species | ASCII text | 6 스탯 바 |

## State shape
```js
STATE.pokedex = {
  seen:   { 1:true, 13:true, ... },
  caught: { 1:true, ... }
};
```

## ASCII 스탯 예시
```
HP  |########--| 110
공격 |#########-| 115
...
```

## Usage
```js
document.getElementById('dex').innerHTML = Pokedex.render('royal');
Pokedex.markSeen(13);
```

## 원작 매칭
41종 도감 = 시즌 1~5 등장 티니핑 전수 반영(로열 12, 일반 20, 빌런 6, 레전드 3). 분류는 원작 "로열/일반/빌런" 구분 + 극장판·레전드(행운/새콤/달콤) 추가.
