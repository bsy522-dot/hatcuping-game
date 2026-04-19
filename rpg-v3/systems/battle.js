// battle.js - 턴제 전투 엔진 (포켓몬식)
// 의존: window.TYPE_CHART, window.getTypeMultiplier, window.STATE
(function(){
  var B = {
    state: null,
    onVictory: null,
    onDefeat: null,

    // 전투 시작
    start: function(playerMon, enemyMon, opts){
      opts = opts || {};
      B.state = {
        player: playerMon,
        enemy: enemyMon,
        turn: 1,
        active: true,
        log: [],
        wild: opts.wild !== false // 야생여부
      };
      B.onVictory = opts.onVictory || null;
      B.onDefeat = opts.onDefeat || null;
      B.log('야생의 '+enemyMon.name+'이(가) 나타났다!');
      return B.state;
    },

    // 로그
    log: function(msg){
      if(!B.state) return;
      B.state.log.push(msg);
      if(B.state.log.length > 50) B.state.log.shift();
    },

    // 타입 배율 적용
    applyTypeMatchup: function(atkType, defTypes){
      if(!atkType || !defTypes) return 1.0;
      var mult = 1.0;
      var dts = Array.isArray(defTypes) ? defTypes : [defTypes];
      for(var i=0;i<dts.length;i++){
        mult *= (window.getTypeMultiplier ? window.getTypeMultiplier(atkType, dts[i]) : 1.0);
      }
      return mult;
    },

    // 데미지 계산 (포켓몬식: 레벨 + 능력치비 기반, 3~6턴 승부)
    calcDamage: function(attacker, defender, skill){
      skill = skill || {power:40, type:attacker.type && attacker.type[0], special:false};
      var isSpecial = !!skill.special;
      var atkStat = isSpecial ? (attacker.spAtk||attacker.stats&&attacker.stats.spAtk||50)
                              : (attacker.atk||attacker.stats&&attacker.stats.atk||50);
      var defStat = isSpecial ? (defender.spDef||defender.stats&&defender.stats.spDef||50)
                              : (defender.def||defender.stats&&defender.stats.def||50);
      var power = skill.power || 40;
      var lv = attacker.lv || 5;
      var lvMod = (2*lv/5 + 2);                            // Lv5→4, Lv10→6, Lv20→10
      var ratio = atkStat / Math.max(20, defStat + 20);    // 0.7~1.3 근방
      var base = Math.max(1, Math.floor((lvMod * power * ratio) / 10) + 1);
      var rng = 0.85 + Math.random()*0.15;
      var dmg = Math.floor(base * rng);

      // 타입 상성
      var typeMult = B.applyTypeMatchup(skill.type, defender.type);
      dmg = Math.floor(dmg * typeMult);

      // 크리티컬 10%
      var crit = Math.random() < 0.1;
      if(crit) dmg = Math.floor(dmg * 1.5);

      return { dmg: Math.max(1,dmg), crit: crit, typeMult: typeMult };
    },

    // 플레이어 행동
    playerAction: function(action, payload){
      if(!B.state || !B.state.active) return;
      var s = B.state;
      if(action === 'attack'){
        var skill = payload || s.player.skills && s.player.skills[0] || {power:40,type:s.player.type&&s.player.type[0]};
        var r = B.calcDamage(s.player, s.enemy, skill);
        s.enemy.hp = Math.max(0, (s.enemy.hp||0) - r.dmg);
        B.log(s.player.name+'의 '+(skill.name||'공격')+'! '+r.dmg+' 데미지'+(r.crit?' (급소!)':'') );
        if(r.typeMult>=1.5) B.log('효과가 굉장했다!');
        else if(r.typeMult<=0.7 && r.typeMult>0) B.log('효과가 별로였다...');

        if(s.enemy.hp <= 0){ return B._victory(); }
      } else if(action === 'run'){
        B.log('도망쳤다!');
        s.active = false;
        return;
      } else if(action === 'item' || action === 'capture' || action === 'swap'){
        // 위임 (capture.js / party.js가 처리)
      }
      B.enemyTurn();
      s.turn++;
      B._tickStatus(s.player);
      B._tickStatus(s.enemy);
    },

    // 적 턴
    enemyTurn: function(){
      if(!B.state || !B.state.active) return;
      var s = B.state;
      if(s.enemy.hp <= 0) return;
      if(s.enemy.status === 'freeze'){ B.log(s.enemy.name+' 얼어서 움직이지 못한다!'); return; }
      if(s.enemy.status === 'sweet_lull' && Math.random()<0.5){ B.log(s.enemy.name+' 달콤함에 취했다!'); return; }

      var skills = s.enemy.skills || [{power:40,type:s.enemy.type&&s.enemy.type[0]}];
      var pick = skills[Math.floor(Math.random()*skills.length)];
      if(typeof pick === 'string') pick = {name:pick, power:40, type:s.enemy.type&&s.enemy.type[0]};
      var r = B.calcDamage(s.enemy, s.player, pick);
      s.player.hp = Math.max(0, (s.player.hp||0) - r.dmg);
      B.log(s.enemy.name+'의 '+(pick.name||'공격')+'! '+r.dmg+' 데미지'+(r.crit?' (급소!)':''));
      if(s.player.hp <= 0){ return B._defeat(); }
    },

    // 상태이상 틱
    _tickStatus: function(mon){
      if(!mon || !mon.status) return;
      if(mon.status === 'burn'){
        var t = Math.max(1, Math.floor((mon.maxHp||mon.hp||30)/16));
        mon.hp = Math.max(0, mon.hp - t);
        B.log(mon.name+' 화상 데미지 '+t);
      }
      if(mon.status === 'freeze' && Math.random()<0.2){ mon.status=null; B.log(mon.name+' 얼음이 녹았다!'); }
    },

    _victory: function(){
      var s = B.state;
      s.active = false;
      B.log(s.enemy.name+'을(를) 쓰러뜨렸다!');
      if(typeof B.onVictory === 'function') B.onVictory(s);
    },

    _defeat: function(){
      var s = B.state;
      s.active = false;
      B.log(s.player.name+'이(가) 쓰러졌다...');
      if(typeof B.onDefeat === 'function') B.onDefeat(s);
    }
  };

  // 턴 순서 (속도 기준) - 외부에서 참조 가능
  B.faster = function(a,b){ return (b.spd||0) - (a.spd||0); };

  window.Battle = B;
})();
