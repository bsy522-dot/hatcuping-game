// capture.js - 포획 시스템 (하츄핑 마음구슬)
// 의존: window.STATE, window.Battle, window.Party
(function(){
  var C = {
    // 포획 확률 계산 (0~100)
    calcCatchRate: function(species, enemy){
      var rarity = (species && species.rarity) || 3; // 1~5
      var base = rarity * 20; // 5=100, 1=20 (역설적: rarity 높을수록 포획 쉬움? 변경)
      // 하츄핑 규칙: 희귀도 낮을수록 포획 쉬움
      base = (6 - rarity) * 20; // r1=100, r5=20
      var maxHp = enemy.maxHp || (enemy.stats && enemy.stats.hp) || 40;
      var hpPct = Math.max(0, Math.min(1, (enemy.hp||0) / maxHp));
      var penalty = Math.floor(hpPct * 50);
      var bonus = 0;
      if(enemy.status === 'sweet_lull' || enemy.status === 'freeze' || enemy.status === 'sleep') bonus = 10;
      var rate = base - penalty + bonus;
      return Math.max(1, Math.min(100, rate));
    },

    // 포획 시도 - 하트 소모
    attempt: function(species, enemy, opts){
      opts = opts || {};
      var S = window.STATE || (window.STATE = {hearts:5, party:[], box:[], pokedex:{seen:{},caught:{}}});
      if((S.hearts||0) <= 0){
        if(window.Battle) window.Battle.log('마음구슬이 부족하다!');
        return { ok:false, reason:'no_heart' };
      }
      S.hearts -= 1;
      var rate = C.calcCatchRate(species, enemy);
      var roll = Math.floor(Math.random()*100);
      var success = roll < rate;
      if(window.Battle) window.Battle.log('마음구슬을 던졌다! ('+rate+'%)');

      if(success){
        if(window.Battle) window.Battle.log(species.name+'을(를) 포획했다!');
        var mon = C._instantiate(species, enemy);
        // 도감
        if(!S.pokedex) S.pokedex = {seen:{},caught:{}};
        S.pokedex.caught[species.no || species.name] = true;
        S.pokedex.seen[species.no || species.name] = true;
        // 파티/박스
        if((S.party||[]).length < 6){ C.addToParty(mon); }
        else { C.sendToBox(mon); }
        if(window.Battle && window.Battle.state){ window.Battle.state.active = false; }
        return { ok:true, mon: mon };
      } else {
        if(window.Battle) window.Battle.log(species.name+'이(가) 마음을 열지 않았다!');
        return { ok:false, reason:'fail', rate: rate };
      }
    },

    _instantiate: function(species, enemy){
      var bs = species.baseStats || {hp:40,atk:40,def:40,spAtk:40,spDef:40,spd:40};
      return {
        id: 'mon_'+Date.now()+'_'+Math.floor(Math.random()*1000),
        speciesNo: species.no,
        name: species.name,
        class: species.class,
        type: species.type,
        level: (enemy.level||5),
        hp: bs.hp, maxHp: bs.hp,
        atk: bs.atk, def: bs.def, spAtk: bs.spAtk, spDef: bs.spDef, spd: bs.spd,
        skills: (species.skills||[]).slice(0,4).map(function(n){ return {name:n,power:40,type:species.type&&species.type[0]}; }),
        exp: 0, status: null
      };
    },

    addToParty: function(mon){
      var S = window.STATE; if(!S.party) S.party=[];
      S.party.push(mon);
    },

    sendToBox: function(mon){
      var S = window.STATE; if(!S.box) S.box=[];
      S.box.push(mon);
      if(window.Battle) window.Battle.log('박스로 보냈다.');
    }
  };
  window.Capture = C;
})();
