// ============================================================
// UNIFIED v4 - CANVAS & DPR
// 420×750 세로 모바일 Canvas. DPR 스케일, resize 대응.
// rpg-v3/index.html의 resizeCanvas 패턴 확장.
// ============================================================
(function(){
  'use strict';

  const LOGICAL_W = 420;
  const LOGICAL_H = 750;

  // DOM은 hatcuping-unified.html에 <canvas id="c">가 이미 있다고 가정.
  let canvasEl = null;
  let ctxRef   = null;

  function ensureCanvas(){
    if(canvasEl && ctxRef) return;
    canvasEl = document.getElementById('c');
    if(!canvasEl){
      console.error('[UCanvas] #c canvas 엘리먼트 없음!');
      return;
    }
    ctxRef = canvasEl.getContext('2d');
  }

  function resize(){
    ensureCanvas();
    if(!canvasEl || !ctxRef) return;
    const dpr = window.devicePixelRatio || 1;
    const s = Math.min(window.innerWidth / LOGICAL_W, window.innerHeight / LOGICAL_H);
    canvasEl.style.width  = Math.floor(LOGICAL_W * s) + 'px';
    canvasEl.style.height = Math.floor(LOGICAL_H * s) + 'px';
    canvasEl.width  = Math.floor(LOGICAL_W * s * dpr);
    canvasEl.height = Math.floor(LOGICAL_H * s * dpr);
    // 좌표계: 로직 (420×750) → 화면픽셀
    ctxRef.setTransform(s * dpr, 0, 0, s * dpr, 0, 0);
    // 이미지 스무딩 (픽셀아트 효과 원하면 false)
    ctxRef.imageSmoothingEnabled = true;
  }

  window.UCanvas = {
    W: LOGICAL_W,
    H: LOGICAL_H,
    get c(){ ensureCanvas(); return canvasEl; },
    get ctx(){ ensureCanvas(); return ctxRef; },
    resize: resize,
    // 클라이언트 좌표 → 논리 좌표 변환 헬퍼
    toLogical(clientX, clientY){
      ensureCanvas();
      if(!canvasEl) return { x: 0, y: 0 };
      const r = canvasEl.getBoundingClientRect();
      return {
        x: (clientX - r.left) * (LOGICAL_W / r.width),
        y: (clientY - r.top)  * (LOGICAL_H / r.height)
      };
    }
  };

  // 첫 로드 시 + 윈도우 리사이즈/회전 시
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', resize);
  } else {
    resize();
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);

  console.log('[UNIFIED] UCanvas 준비:', LOGICAL_W, 'x', LOGICAL_H);
})();
