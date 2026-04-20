// ============================================================
// UNIFIED v4 - SAVE / LOAD
// localStorage 'hatcuping_unified_v4'에 STATE 전체 JSON 저장
// ============================================================
(function(){
  'use strict';

  const KEY = 'hatcuping_unified_v4';

  // 순환참조·휘발성 필드 제외 리스트
  const SKIP_KEYS = ['transition', 'battle', 'battleResult', 'prevMode'];

  function serialize(){
    const S = window.STATE;
    const out = {};
    Object.keys(S).forEach(k=>{
      if(SKIP_KEYS.indexOf(k) !== -1) return;
      if(typeof S[k] === 'function') return;
      out[k] = S[k];
    });
    return out;
  }

  window.UnifiedSave = {
    save(){
      try{
        const data = serialize();
        localStorage.setItem(KEY, JSON.stringify(data));
        console.log('[UnifiedSave] 저장 완료. Act', data.act, 'mode', data.mode);
        return true;
      }catch(e){
        console.error('[UnifiedSave] 저장 실패:', e);
        return false;
      }
    },

    load(){
      try{
        const raw = localStorage.getItem(KEY);
        if(!raw) return false;
        const data = JSON.parse(raw);
        if(!data || data.version !== 'v4'){
          console.warn('[UnifiedSave] 버전 불일치, 무시');
          return false;
        }
        // STATE에 덮어쓰기
        Object.keys(data).forEach(k=>{ window.STATE[k] = data[k]; });
        // 휘발성 필드 초기화
        window.STATE.transition = null;
        window.STATE.battle = null;
        window.STATE.battleResult = null;
        console.log('[UnifiedSave] 불러오기 완료. Act', window.STATE.act, 'mode', window.STATE.mode);
        return true;
      }catch(e){
        console.error('[UnifiedSave] 불러오기 실패:', e);
        return false;
      }
    },

    has(){
      try{ return !!localStorage.getItem(KEY); }
      catch(e){ return false; }
    },

    clear(){
      try{ localStorage.removeItem(KEY); return true; }
      catch(e){ return false; }
    }
  };

  console.log('[UNIFIED] UnifiedSave 준비. 세이브 존재?', window.UnifiedSave.has());
})();
