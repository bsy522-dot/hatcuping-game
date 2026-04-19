# battle.js - 턴제 전투 엔진

## Purpose
포켓몬식 턴제 전투 1:1 엔진. 감정타입 상성, 급소, 상태이상(화상/얼음/달콤최면)을 지원한다. 승리시 `onVictory` 콜백으로 경험치/배지 처리를 외부에 위임.

## API

| Method | Params | Returns | 설명 |
|---|---|---|---|
| `start(player, enemy, opts)` | player/enemy 개체, `{wild, onVictory, onDefeat}` | state | 전투 초기화 |
| `playerAction(action, payload)` | action: `'attack'\|'run'\|'item'\|'capture'\|'swap'`, payload: skill | void | 플레이어 턴 수행 후 적 턴 자동 |
| `enemyTurn()` | - | void | 적 1회 공격 |
| `calcDamage(atk, def, skill)` | 공격자/방어자/스킬 | `{dmg, crit, typeMult}` | 데미지 계산 |
| `applyTypeMatchup(atkType, defTypes)` | 문자열/배열 | number | 타입배율 곱 |
| `log(msg)` | string | void | 전투 로그 추가 (max 50) |

## State shape
```js
Battle.state = {
  player: { name, hp, maxHp, atk, def, spAtk, spDef, spd, skills[], type[], status },
  enemy:  { ...동일 },
  turn:   number,
  active: boolean,
  log:    string[],
  wild:   boolean
}
```

## 공식
- 기본: `max(1, atkStat + skillPower - floor(defStat*0.4)) + rng(0,4)`
- 특수공격 여부(`skill.special`)에 따라 spAtk/spDef 사용
- 타입배율: `window.TYPE_CHART`를 통해 `getTypeMultiplier` 호출
- 크리: 10% 확률 ×1.5

## Usage
```js
Battle.start(myHatchuping, wildNadoping, {
  wild: true,
  onVictory: function(s){ Party.levelUp(s.player, 20); },
  onDefeat: function(){ location.hash = '#gameover'; }
});
Battle.playerAction('attack', { name:'하트펀치', power:50, type:'사랑' });
```

## 원작 매칭
캐치!티니핑 세계관에서 "하트 공격/마음구슬"을 감정타입 상성으로 변환. 빌런 대응시 어둠 약점이 사랑(×1.5)이라는 원작 설정 반영.
