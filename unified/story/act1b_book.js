// ============================================================
// UNIFIED v4 - ACT1B: 하츄핑 전설서 (책 읽기)
// 3~4 페이지 텍스트 → 결심 → Act2(platformer 탈출) 트리거
// onComplete: { triggerMode:'platformer', next:'act2_escape' }
// ============================================================
(function(){
  'use strict';

  const A_ROMI  = { id:'romi',  name:'로미',   side:'right' };
  const A_KKONG = { id:'kkong', name:'꽁꽁핑', side:'left'  };

  const scenes = [
    // ---------- 1. 전설서 1페이지 ----------
    {
      id: 'act1b_book_p1',
      location: 'castle_bedroom',
      bg: 'bg_castle',
      actors: [ A_ROMI ],
      dialog: [
        { who:'narration', text:'── 「하츄핑 전설서」 제 1장 ──' },
        { who:'narration', text:'아주 먼 옛날, 이모션 왕국의 한구석에\n「금단의 숲」이 있었다.' },
        { who:'narration', text:'그 숲 깊은 곳에,\n세상 모든 사랑을 담은 분홍빛 심장의 아이가 숨어 살았다.' },
        { who:'narration', text:'그 아이의 이름은 — 하츄핑.' }
      ]
    },

    // ---------- 2. 전설서 2페이지 ----------
    {
      id: 'act1b_book_p2',
      location: 'castle_bedroom',
      bg: 'bg_castle',
      actors: [ A_ROMI ],
      dialog: [
        { who:'narration', text:'── 제 2장 ──' },
        { who:'narration', text:'하츄핑은 단 한 사람, 자신을 진심으로 부르는 "짝꿍"에게만 모습을 보인다.' },
        { who:'narration', text:'그 짝꿍은… 태어날 때부터 정해져 있다.' },
        { who:'narration', text:'오직 서로의 심장만이, 서로를 알아볼 수 있다고 한다.' }
      ]
    },

    // ---------- 3. 전설서 3페이지 (경고) ----------
    {
      id: 'act1b_book_p3',
      location: 'castle_bedroom',
      bg: 'bg_castle',
      actors: [ A_ROMI ],
      dialog: [
        { who:'narration', text:'── 제 3장 · 경고 ──' },
        { who:'narration', text:'그러나 금단의 숲에 이르기까지는\n수많은 시련이 기다린다.' },
        { who:'narration', text:'성을 지키는 기사들, 얼어붙은 거리,\n폭주하는 특급버스, 그리고 외로움에 지친 티니핑들…' },
        { who:'narration', text:'짝꿍이 진심이 아니라면,\n하츄핑은 결코 모습을 드러내지 않을 것이다.' }
      ]
    },

    // ---------- 4. 결심 ----------
    {
      id: 'act1b_book_decide',
      location: 'castle_bedroom',
      bg: 'bg_castle',
      actors: [ A_ROMI, A_KKONG ],
      dialog: [
        { who:'narration', text:'로미는 책을 천천히 덮었다.\n가슴이 쿵, 하고 뛴다.' },
        { who:'romi',  text:'…내 심장이 그 아이를 알아본 거야.\n꿈도, 이 책도, 다 그 이유였어.' },
        { who:'romi',  text:'꽁꽁핑.\n나, 하츄핑을 만나러 갈래.' },
        { who:'kkong', text:'에에?! 로미님, 성 밖은 위험하다구요!\n기사님들도 절대 안 보내주실 거예요!' },
        { who:'romi',  text:'알아. 그러니까…\n몰래 나가야지.' },
        { who:'kkong', text:'모, 몰래?!\n꽁꽁핑도 같이 갈래요!\n로미님 혼자 보내면 제 심장이 얼어붙을 거예요!' },
        { who:'romi',  text:'(웃으며)\n…고마워, 꽁꽁핑.\n가자. 성을 빠져나가는 거야.' }
      ]
    }
  ];

  window.ACT1B_BOOK = {
    id: 'act1b_book',
    title: '하츄핑 전설서',
    scenes: scenes,
    onComplete: {
      triggerMode: 'platformer',
      next: 'act2_escape',
      setFlags: { act1_done: true, hatchu_legend_read: true }
    }
  };

  console.log('[UNIFIED] ACT1B_BOOK 로드 완료 —', scenes.length, '씬');
})();
