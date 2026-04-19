// gym.js - 8 감정 체육관
// 의존: window.TINIPING_DEX, window.STATE, window.Battle
(function(){
  // 배지 순서
  var BADGES = ['사랑','정직','용기','여유','얼음','불','어둠','별'];

  // 체육관 리더 (8명)
  var LEADERS = [
    { badge:'사랑',   name:'로미',    partyNames:['하츄핑','다해핑','기쁘핑'],        reward:100 },
    { badge:'정직',   name:'바로팡',  partyNames:['바로핑','믿어핑','트러핑'],        reward:150 },
    { badge:'용기',   name:'아르민',  partyNames:['아자핑','투투핑','분노핑'],        reward:200 },
    { badge:'여유',   name:'차윤',    partyNames:['차차핑','느긋핑','포실핑'],        reward:250 },
    { badge:'얼음',   name:'세라',    partyNames:['꽁꽁핑','달님핑','그림자핑'],      reward:300 },
    { badge:'불',     name:'플레임',  partyNames:['해님핑','분노핑','새콤핑'],        reward:350 },
    { badge:'어둠',   name:'녹스',    partyNames:['시크핑','어둠핑','미움핑'],        reward:400 },
    { badge:'별',     name:'스텔라',  partyNames:['샤샤핑','별님핑','행운핑'],        reward:500 }
  ];

  var G = {
    BADGES: BADGES,
    LEADERS: LEADERS,

    // 리더 파티 빌드 (species → 전투 개체)
    _buildParty: function(names, baseLv){
      var dex = window.TINIPING_DEX || [];
      return names.map(function(nm, i){
        var sp = dex.find(function(s){ return s.name === nm; });
        if(!sp) return null;
        var bs = sp.baseStats;
        var lv = baseLv + i*2;
        return {
          name: sp.name, speciesNo: sp.no, class: sp.class, type: sp.type,
          level: lv,
          hp: bs.hp + lv*2, maxHp: bs.hp + lv*2,
          atk: bs.atk + lv, def: bs.def + lv,
          spAtk: bs.spAtk + lv, spDef: bs.spDef + lv, spd: bs.spd + lv,
          skills: (sp.skills||[]).slice(0,4).map(function(n){ return {name:n,power:50,type:sp.type[0]}; })
        };
      }).filter(Boolean);
    },

    // 체육관 도전
    challenge: function(badgeName, opts){
      opts = opts || {};
      var leader = LEADERS.find(function(l){ return l.badge === badgeName; });
      if(!leader) return { ok:false, reason:'no_leader' };
      var S = window.STATE || (window.STATE={});
      if((S.badges||[]).indexOf(badgeName) >= 0) return { ok:false, reason:'already_won' };

      var party = G._buildParty(leader.partyNames, opts.baseLv || 15);
      return { ok:true, leader: leader, party: party };
    },

    // 배지 지급
    grantBadge: function(badgeName){
      var S = window.STATE || (window.STATE={});
      if(!S.badges) S.badges = [];
      if(S.badges.indexOf(badgeName) < 0){
        S.badges.push(badgeName);
        return true;
      }
      return false;
    },

    // 다음 액트 해금 조건 (N개 배지 필요)
    checkUnlock: function(actNo){
      var S = window.STATE || {};
      var have = (S.badges || []).length;
      // Act1→2: 2배지, Act2→3: 4, Act3→4: 6, Act4(엔딩): 8
      var need = [0,0,2,4,6,8][actNo] || 0;
      return { unlocked: have >= need, have: have, need: need };
    }
  };
  window.Gym = G;
})();
