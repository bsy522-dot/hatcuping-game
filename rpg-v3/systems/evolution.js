// evolution.js - 진화 시스템 (일반 → 로열 각성)
// 의존: window.TINIPING_DEX, window.STATE
(function(){
  var E = {
    // 레벨업 후 진화 체크
    check: function(mon){
      if(!mon) return null;
      var dex = window.TINIPING_DEX || [];
      var species = dex.find(function(s){ return s.no === mon.speciesNo || s.name === mon.name; });
      if(!species || !species.evolveTo) return null;
      if(!species.evolveLv || mon.level < species.evolveLv) return null;

      // 특수조건: 일반→로열 각성은 보석드래곤 축복 필요
      var isAwaken = species.class === 'normal' && E._isRoyalAwakening(species.evolveTo);
      if(isAwaken){
        var S = window.STATE || {};
        var flags = S.storyFlags || {};
        if(!flags.jewelDragonBlessing) return null;
      }
      return { from: species, toName: species.evolveTo };
    },

    _isRoyalAwakening: function(evolveToName){
      var dex = window.TINIPING_DEX || [];
      var target = dex.find(function(s){ return s.name === evolveToName; });
      return target && target.class === 'royal';
    },

    // 진화 실행
    trigger: function(mon, onDone){
      var evo = E.check(mon);
      if(!evo){ if(onDone) onDone(false); return false; }
      E.animate(mon, evo, function(){
        var dex = window.TINIPING_DEX || [];
        var newSpecies = dex.find(function(s){ return s.name === evo.toName; });
        if(newSpecies){
          mon.speciesNo = newSpecies.no;
          mon.name = newSpecies.name;
          mon.class = newSpecies.class;
          mon.type = newSpecies.type;
          var bs = newSpecies.baseStats;
          mon.maxHp = bs.hp + (mon.level-1)*2;
          mon.atk = bs.atk; mon.def = bs.def;
          mon.spAtk = bs.spAtk; mon.spDef = bs.spDef; mon.spd = bs.spd;
          mon.hp = mon.maxHp; // 진화시 회복
        }
        if(onDone) onDone(true, mon);
      });
      return true;
    },

    // 애니메이션 (1.2s 화이트 플래시)
    animate: function(mon, evo, done){
      var el = document.createElement('div');
      el.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;display:flex;align-items:center;justify-content:center;font-size:32px;color:#ff69b4;font-weight:bold;';
      el.textContent = '??? 진화중!';
      document.body.appendChild(el);
      requestAnimationFrame(function(){ el.style.opacity='1'; });
      // 팡파레
      try{
        var ctx = new (window.AudioContext||window.webkitAudioContext)();
        [523,659,784,1047].forEach(function(f,i){
          var o=ctx.createOscillator(), g=ctx.createGain();
          o.frequency.value=f; o.connect(g); g.connect(ctx.destination);
          g.gain.setValueAtTime(0.1, ctx.currentTime + i*0.15);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i*0.15+0.3);
          o.start(ctx.currentTime + i*0.15); o.stop(ctx.currentTime + i*0.15+0.3);
        });
      }catch(e){}
      setTimeout(function(){
        el.textContent = evo.toName + '으로 진화했다!';
        setTimeout(function(){
          el.style.opacity='0';
          setTimeout(function(){ el.remove(); if(done) done(); }, 300);
        }, 600);
      }, 600);
    }
  };
  window.Evolution = E;
})();
