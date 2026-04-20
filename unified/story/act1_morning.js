// ============================================================
// UNIFIED v4 - ACT1: 로미의 아침
// 침실 기상 → 꽁꽁핑 등장 → 창밖의 눈 → 눈보라 심해짐 → 미니게임 트리거
// onComplete: { triggerMode:'dodge', returnTo:'act1_post_dodge' }
// ============================================================
(function(){
  'use strict';

  // 자주 쓰는 배우 정의 (한 번만)
  const A_ROMI  = { id:'romi',  name:'로미',   side:'right' };
  const A_KKONG = { id:'kkong', name:'꽁꽁핑', side:'left'  };

  const scenes = [
    // ---------- 1. 기상 (로미 혼자) ----------
    {
      id: 'act1_s1_wake',
      location: 'castle_bedroom',
      bg: 'bg_castle',
      actors: [ A_ROMI ],
      dialog: [
        { who:'narration', text:'아침이다.\n창밖이 왠지… 새하얗다.' },
        { who:'narration', text:'에몬왕국 성의 침실, 로미 공주의 하루가 시작된다.' },
        { who:'romi', text:'으…응…\n오늘따라 왜 이렇게 방이 춥지?' },
        { who:'romi', text:'(이불을 꼭 여미며)\n…조금만 더 잘까…' }
      ]
    },

    // ---------- 2. 꽁꽁핑 등장 ----------
    {
      id: 'act1_s2_kkong_in',
      location: 'castle_bedroom',
      bg: 'bg_castle',
      actors: [ A_ROMI, A_KKONG ],
      dialog: [
        { who:'narration', text:'폴짝— 하고, 푸른 티니핑 하나가 이불 위로 뛰어올랐다.' },
        { who:'kkong', text:'로미니임~! 일어났어요?!' },
        { who:'kkong', text:'꽁꽁핑이 오늘도 제일 먼저 왔어요!\n헤헤—' },
        { who:'romi',  text:'꽁꽁핑… 또 너야…?\n몇 시야, 지금?' },
        { who:'kkong', text:'시간은 중요하지 않죠~\n중요한 건! 밖이에요!\n나가봐요, 얼른 얼른!' }
      ]
    },

    // ---------- 3. 창밖 보기 ----------
    {
      id: 'act1_s3_window',
      location: 'castle_bedroom',
      bg: 'bg_castle',
      actors: [ A_ROMI, A_KKONG ],
      dialog: [
        { who:'narration', text:'로미가 침대에서 일어나 커튼을 젖혔다.' },
        { who:'romi', text:'…어?' },
        { who:'romi', text:'눈이…?\n4월인데 눈이 이렇게나?' },
        { who:'romi', text:'(꽁꽁핑을 흘깃 쳐다보며)\n…꽁꽁핑. 너 또 장난친 거지?' },
        { who:'kkong', text:'네?! 아니에요! 저 진짜 아니에요!' },
        { who:'kkong', text:'(눈동자 빙글빙글)\n…진짜로요…?' }
      ]
    },

    // ---------- 4. 꽁꽁핑 당황 (개그 포인트) ----------
    {
      id: 'act1_s4_kkong_confess',
      location: 'castle_bedroom',
      bg: 'bg_castle',
      actors: [ A_ROMI, A_KKONG ],
      dialog: [
        { who:'kkong', text:'그게… 어제 밤에…' },
        { who:'kkong', text:'"조금만 눈 내렸으면 좋겠다~" 하고\n살~짝 입김을 불었는데…' },
        { who:'kkong', text:'…맞아요 헤헤…\n제가 좀 많이 세게 불었나 봐요…' },
        { who:'romi',  text:'꽁꽁핑!!' },
        { who:'kkong', text:'히익! 미안해요 로미님—!\n하지만 예쁘잖아요, 그죠? 네?' }
      ]
    },

    // ---------- 5. 로미의 내적 동기 (영화 감성) ----------
    {
      id: 'act1_s5_longing',
      location: 'castle_bedroom',
      bg: 'bg_castle',
      actors: [ A_ROMI, A_KKONG ],
      dialog: [
        { who:'narration', text:'로미는 창문에 이마를 갖다 댔다.\n하얀 숨이 유리에 서렸다.' },
        { who:'romi', text:'…예쁘긴 하네.' },
        { who:'romi', text:'근데 꽁꽁핑.\n나… 요즘 자꾸 이상한 꿈을 꿔.' },
        { who:'romi', text:'분홍빛 심장 같은 아이가\n날 부르는 꿈.' },
        { who:'romi', text:'"…하츄핑이야."\n꿈속에서 그 아이가 그랬어.' },
        { who:'kkong', text:'하츄핑을요?\n그…그거 혹시, 금단의 숲이라는 데에 사는 걔…?' },
        { who:'romi', text:'응. 나 그 아이를 꼭 만나야 해.\n왠지는 모르겠는데… 만나야만 해.' }
      ]
    },

    // ---------- 6. 눈보라 심해짐 → 미니게임 트리거 ----------
    {
      id: 'act1_s6_storm',
      location: 'castle_bedroom',
      bg: 'bg_castle',
      actors: [ A_ROMI, A_KKONG ],
      dialog: [
        { who:'narration', text:'쿠웅—!\n창문이 거세게 흔들렸다.' },
        { who:'kkong', text:'어어?! 로미님, 이거 제가 한 거 아니에요!\n진짜로요!' },
        { who:'romi', text:'(창 너머를 보며)\n…눈이 점점 더 세져.\n이건 이상해.' },
        { who:'narration', text:'지붕 타일이 우지끈, 떨어져 내린다.\n눈덩이가 로미의 침실 쪽으로 쏟아지기 시작했다!' },
        { who:'romi', text:'꽁꽁핑, 피해!\n떨어지는 눈덩이를 피해야 해—!' }
      ]
    }
  ];

  window.ACT1 = {
    id: 'act1_morning',
    title: '로미의 아침',
    scenes: scenes,
    onComplete: {
      triggerMode: 'dodge',
      returnTo:   'act1_post_dodge',
      // 플래그 설정은 Dispatcher가 읽어서 처리
      setFlags:   { act1_intro_done: true }
    }
  };

  console.log('[UNIFIED] ACT1 (로미의 아침) 로드 완료 —', scenes.length, '씬');
})();
