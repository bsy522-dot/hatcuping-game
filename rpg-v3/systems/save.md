# save.js - 세이브 시스템

## Purpose
localStorage 단일 슬롯 세이브. 키: `hatcuping_rpg3_save`.

## API

| Method | Params | Returns | 설명 |
|---|---|---|---|
| `save()` | - | bool | 현재 STATE를 직렬화 |
| `load()` | - | data or null | STATE에 역직렬화 후 반환 |
| `reset()` | - | void | 세이브 삭제 |
| `exists()` | - | bool | 슬롯 존재 여부 |

## 직렬화 필드
```
v, ts, party, box, storyFlags, badges, pokedex, items, hearts, currentMap, playerPos, act
```

## Usage
```js
window.addEventListener('beforeunload', SaveGame.save);
if(SaveGame.exists()) SaveGame.load();
```

## 원작 매칭
원작에는 세이브 개념이 없으나, RPG에서는 맵/파티/도감/배지를 유지해야 하므로 필수 인프라. 스토리 플래그(`jewelDragonBlessing` 등)로 각성 조건 기억.
