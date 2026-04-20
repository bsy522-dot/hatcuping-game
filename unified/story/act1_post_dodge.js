// ============================================================
// UNIFIED v4 - ACT1 POST DODGE: 눈 피한 후 방 복귀
// 미니게임(dodge) 클리어 후 자동 재진입.
// onComplete: { triggerMode:'v2_scene', next:'act1b_book' }
// ============================================================
(function(){
  'use strict';

  const A_ROMI  = { id:'romi',  name:'로미',   side:'right' };
  const A_KKONG = { id:'kkong', name:'꽁꽁핑', side:'left'  };

  const scenes = [
    // ---------- 1. 휴… 끝났다 ----------
    {
      id: 'act1b_s1_relief',
      location: 'castle_bedroom',
      bg: 'bg_castle',
      actors: [ A_ROMI, A_KKONG ],
      dialog: [
        { who:'narration', text:'겨우겨우 눈덩이를 다 피해냈다.\n숨이 턱까지 차오른다.' },
        { who:'romi',  text:'…후…\n…끝났다…' },
        { who:'kkong', text:'로미님 대단해요!\n꽁꽁핑은 침대 밑에 숨어 있었다구요, 헤헤.' },
        { who:'romi',  text:'(이마의 땀을 닦으며)\n너는 진짜…\n일 저지르고 숨는 거 하나는 선수지.' },
        { who:'kkong', text:'칭찬 감사합니다아~!' },
        { who:'romi',  text:'…칭찬 아니야.' }
      ]
    },

    // ---------- 2. 책상 위의 이상한 책 발견 ----------
    {
      id: 'act1b_s2_discover',
      location: 'castle_bedroom',
      bg: 'bg_castle',
      actors: [ A_ROMI, A_KKONG ],
      dialog: [
        { who:'narration', text:'로미는 엉망이 된 방을 둘러보았다.\n그때, 책상 위에서 낯선 빛이 새어 나왔다.' },
        { who:'romi',  text:'…저건 뭐지?' },
        { who:'kkong', text:'어라? 저 책… 아까까진 없었는데요?' },
        { who:'narration', text:'책 표지에 적힌 글씨 —\n「하츄핑 전설서」.' },
        { who:'romi',  text:'하츄핑… 전설서?\n꿈에서 본 그 이름이랑 똑같아.' },
        { who:'kkong', text:'로미님, 이거 읽어볼래요?\n…조금 무서운데…\n그래도 궁금하잖아요?' }
      ]
    },

    // ---------- 3. 결심 ----------
    {
      id: 'act1b_s3_choice',
      location: 'castle_bedroom',
      bg: 'bg_castle',
      actors: [ A_ROMI, A_KKONG ],
      dialog: [
        { who:'romi',  text:'(책을 집어 들며)\n읽어봐야겠어.\n이건 우연이 아니야.' },
        { who:'narration', text:'로미가 책장을 조심스레 펼친다.\n따뜻한 분홍빛이 방 안을 가득 채웠다—' }
      ]
    }
  ];

  window.ACT1_POST = {
    id: 'act1_post_dodge',
    title: '눈보라를 피한 뒤',
    scenes: scenes,
    onComplete: {
      triggerMode: 'v2_scene',
      next: 'act1b_book',
      setFlags: { act1_book_found: true }
    }
  };

  console.log('[UNIFIED] ACT1_POST 로드 완료 —', scenes.length, '씬');
})();
