// save.js - localStorage 세이브/로드
(function(){
  var KEY = 'hatcuping_rpg3_save';
  var S = {
    save: function(){
      var st = window.STATE || {};
      var data = {
        v: 1,
        ts: Date.now(),
        party: st.party || [],
        box: st.box || [],
        storyFlags: st.storyFlags || {},
        badges: st.badges || [],
        pokedex: st.pokedex || {seen:{},caught:{}},
        items: st.items || {},
        hearts: st.hearts || 0,
        currentMap: st.currentMap || 'heart_village',
        playerPos: st.playerPos || {x:0,y:0},
        act: st.act || 1
      };
      try{
        localStorage.setItem(KEY, JSON.stringify(data));
        return true;
      }catch(e){ return false; }
    },
    load: function(){
      try{
        var raw = localStorage.getItem(KEY);
        if(!raw) return null;
        var data = JSON.parse(raw);
        window.STATE = window.STATE || {};
        Object.keys(data).forEach(function(k){ window.STATE[k] = data[k]; });
        return data;
      }catch(e){ return null; }
    },
    reset: function(){
      try{ localStorage.removeItem(KEY); }catch(e){}
    },
    exists: function(){
      try{ return !!localStorage.getItem(KEY); }catch(e){ return false; }
    }
  };
  window.SaveGame = S;
})();
