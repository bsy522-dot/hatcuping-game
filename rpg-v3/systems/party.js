// party.js - 파티/박스 관리
// 의존: window.STATE, window.Evolution
(function(){
  var MAX = 6;
  var P = {
    MAX: MAX,
    _S: function(){
      var S = window.STATE || (window.STATE={});
      if(!S.party) S.party=[];
      if(!S.box) S.box=[];
      return S;
    },
    add: function(mon){
      var S = P._S();
      if(S.party.length < MAX){ S.party.push(mon); return 'party'; }
      S.box.push(mon); return 'box';
    },
    remove: function(idx){
      var S = P._S();
      if(idx<0 || idx>=S.party.length) return null;
      return S.party.splice(idx,1)[0];
    },
    // 파티 내 위치 교체 or 박스와 스왑
    swap: function(i, j, target){
      var S = P._S();
      target = target || 'party';
      if(target === 'party'){
        if(i<0||j<0||i>=S.party.length||j>=S.party.length) return false;
        var t = S.party[i]; S.party[i]=S.party[j]; S.party[j]=t;
        return true;
      }
      // 파티[i] <-> 박스[j]
      if(i<0||i>=S.party.length||j<0||j>=S.box.length) return false;
      var tmp = S.party[i]; S.party[i] = S.box[j]; S.box[j] = tmp;
      return true;
    },
    box: function(){ return P._S().box; },
    getLeader: function(){
      var S = P._S();
      return S.party[0] || null;
    },
    // 전원 회복 (보석드래곤 성소)
    heal: function(){
      var S = P._S();
      S.party.forEach(function(m){
        m.hp = m.maxHp || m.hp;
        m.status = null;
      });
      return S.party.length;
    },
    // 레벨업 처리 (경험치 → 레벨)
    levelUp: function(mon, expGained){
      mon.exp = (mon.exp||0) + expGained;
      var leveled = false;
      while(mon.exp >= P._expForNext(mon.level)){
        mon.exp -= P._expForNext(mon.level);
        mon.level++;
        // 스탯 상승
        mon.maxHp += 3; mon.hp = mon.maxHp;
        mon.atk += 2; mon.def += 2;
        mon.spAtk += 2; mon.spDef += 2; mon.spd += 1;
        leveled = true;
      }
      // 진화 체크
      if(leveled && window.Evolution){
        var evo = window.Evolution.check(mon);
        if(evo){ return { leveled:true, evolve:evo }; }
      }
      return { leveled: leveled };
    },
    _expForNext: function(lv){ return Math.floor(10 * Math.pow(lv, 1.5)); }
  };
  window.Party = P;
})();
