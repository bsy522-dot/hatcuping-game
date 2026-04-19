// pokedex.js - 티니핑 도감 (4탭: royal/normal/villain/legend)
// 의존: window.TINIPING_DEX, window.STATE, window.TYPE_COLORS
(function(){
  var P = {
    _ensure: function(){
      var S = window.STATE || (window.STATE={});
      if(!S.pokedex) S.pokedex = {seen:{}, caught:{}};
      return S.pokedex;
    },
    markSeen: function(idOrNo){ P._ensure().seen[idOrNo] = true; },
    markCaught: function(idOrNo){ var pd=P._ensure(); pd.caught[idOrNo]=true; pd.seen[idOrNo]=true; },
    getEntry: function(idOrNo){
      var dex = window.TINIPING_DEX || [];
      return dex.find(function(s){ return s.no === idOrNo || s.name === idOrNo; });
    },
    // 5바 스탯 렌더 (ASCII-safe)
    getStats: function(species){
      if(!species || !species.baseStats) return '';
      var bs = species.baseStats;
      var stats = [['HP',bs.hp],['공격',bs.atk],['방어',bs.def],['특공',bs.spAtk],['특방',bs.spDef],['속도',bs.spd]];
      var max = 130;
      return stats.map(function(s){
        var n = Math.floor(s[1]/max*10);
        var bar = new Array(n+1).join('#') + new Array(10-n+1).join('-');
        return s[0].padEnd(3,' ')+' |'+bar+'| '+s[1];
      }).join('\n');
    },
    // 4탭 그리드 렌더 (HTML 문자열 반환)
    render: function(activeTab){
      activeTab = activeTab || 'royal';
      var dex = window.TINIPING_DEX || [];
      var pd = P._ensure();
      var tabs = ['royal','normal','villain','legend'];
      var tabNames = {royal:'로열',normal:'일반',villain:'빌런',legend:'레전드'};
      var list = dex.filter(function(s){ return s.class === activeTab; });

      var html = '<div class="pokedex-root">';
      html += '<div class="pokedex-tabs">';
      tabs.forEach(function(t){
        html += '<button class="pokedex-tab'+(t===activeTab?' active':'')+'" data-tab="'+t+'">'+tabNames[t]+'</button>';
      });
      html += '</div><div class="pokedex-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">';
      list.forEach(function(s){
        var key = s.no;
        var caught = !!pd.caught[key];
        var seen = !!pd.seen[key];
        var color = (window.TYPE_COLORS && window.TYPE_COLORS[s.type&&s.type[0]]) || '#ccc';
        var style = 'padding:8px;border:2px solid '+color+';border-radius:8px;text-align:center;cursor:pointer;';
        if(!seen) style += 'opacity:0.3;filter:grayscale(1);';
        else if(!caught) style += 'filter:brightness(0.5) contrast(2);';
        var name = caught ? s.name : (seen ? s.name : '???');
        html += '<div class="pokedex-cell" data-no="'+s.no+'" style="'+style+'">'
              + '<div style="font-size:11px;color:#888;">No.'+s.no+'</div>'
              + '<div style="font-weight:bold;">'+name+'</div>'
              + '<div style="font-size:10px;">'+(caught?s.emotion:'')+'</div>'
              + '</div>';
      });
      html += '</div>';
      // 카운트
      var total = list.length;
      var caughtN = list.filter(function(s){ return pd.caught[s.no]; }).length;
      html += '<div style="margin-top:12px;">포획: '+caughtN+'/'+total+'</div>';
      html += '</div>';
      return html;
    },

    // 상세 패널
    renderDetail: function(no){
      var s = P.getEntry(no);
      if(!s) return '';
      var pd = P._ensure();
      if(!pd.caught[no]) return '<div>???<br>아직 포획하지 못했다.</div>';
      return '<div class="pokedex-detail">'
        + '<h3>No.'+s.no+' '+s.name+'</h3>'
        + '<div>타입: '+s.type.join('/')+' / 감정: '+s.emotion+'</div>'
        + '<div>서식지: '+(s.habitat||[]).join(', ')+'</div>'
        + '<p>'+s.desc+'</p>'
        + '<pre style="font-family:monospace;">'+P.getStats(s)+'</pre>'
        + '</div>';
    }
  };
  window.Pokedex = P;
})();
