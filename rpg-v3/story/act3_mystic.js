// Act 3: S3 — 미스틱마을 + 제니 최종전 (엔딩 A)
// 레이븐 관장 → 잊혀진 도서관 → 보석드래곤 → 제니 2페이즈 최종전
window.ACT3 = {
  id: 'act3',
  title: '차원의 끝에서',
  season: 'S3',
  unlockCondition: 'act2_done',
  bgm: 'bgm_mystic_village',
  scenes: [
    {
      id: 'mystic_entry',
      location: 'mystic_village',
      actors: ['romi', 'hatchu'],
      dialog: [
        { who: 'romi', text: '안개가… 자욱하다 🌫️' },
        { who: 'hatchu', text: '핑… (바짝 붙음)' },
        { who: 'romi', text: '괜찮아 하츄핑, 내가 있잖아 💕' },
        { who: 'narration', text: '미스틱마을. 고대 마법사들의 땅.' }
      ]
    },
    {
      id: 'gym_raven',
      location: 'raven_tower',
      actors: ['romi', 'raven'],
      dialog: [
        { who: 'raven', text: '…로미 공주. 기다렸다.' },
        { who: 'romi', text: '엇 내 이름 알아요?' },
        { who: 'raven', text: '별이 말해줬지. 시험을 받아라.' },
        { who: 'narration', text: '— 관장전 승리 —' },
        { who: 'raven', text: '합격. 레이븐 하트윙을 주마. 🦅' },
        { who: 'romi', text: '와… 날개?! 날 수 있어?!' },
        { who: 'raven', text: '차원의 끝까진 날아갈 수 있다.' }
      ]
    },
    {
      id: 'forgotten_library',
      location: 'forgotten_library',
      actors: ['romi', 'hatchu'],
      dialog: [
        { who: 'romi', text: '책이 산더미야… 📚' },
        { who: 'hatchu', text: '핑?! (책 사이에서 열쇠)' },
        { who: 'romi', text: '마스터키?! 이걸 찾아야 돼!' },
        { who: 'narration', text: '— 퍼즐 해결 —' },
        { who: 'romi', text: '이걸로 차원의 문 열 수 있어 💕' }
      ]
    },
    {
      id: 'jewel_dragon',
      location: 'dragon_shrine',
      actors: ['romi', 'jewel_dragon'],
      dialog: [
        { who: 'jewel_dragon', text: '그르릉… 통과하려면 나를 넘어라.' },
        { who: 'romi', text: '보석드래곤?! 수호자야?!' },
        { who: 'jewel_dragon', text: '네 마음을 시험하겠다.' },
        { who: 'narration', text: '— 수호자전 승리 —' },
        { who: 'jewel_dragon', text: '…허락한다. 차원의 끝으로.' }
      ]
    },
    {
      id: 'jenny_final_p1',
      location: 'dimension_end',
      actors: ['romi', 'hatchu', 'jenny'],
      dialog: [
        { who: 'jenny', text: '또 왔구나.' },
        { who: 'romi', text: '제니… 너 부모님 잃었다며.' },
        { who: 'jenny', text: '!! 누가 그래?!' },
        { who: 'romi', text: '나도 아빠 못 본 지 오래야…' },
        { who: 'romi', text: '근데 싸우면 못 찾아 💕' },
        { who: 'jenny', text: '…닥쳐! 하트링만 있으면 돼!' },
        { who: 'narration', text: '— 제니 1페이즈 —' }
      ]
    },
    {
      id: 'jenny_final_p2',
      location: 'dimension_end',
      actors: ['romi', 'hatchu', 'jenny'],
      dialog: [
        { who: 'jenny', text: '아직이야!! 어둠이여!!' },
        { who: 'narration', text: '제니 다크폼 변신! 😱' },
        { who: 'romi', text: '하츄핑… 우리 마음 하나로!' },
        { who: 'hatchu', text: '하츄핑!! 💕✨' },
        { who: 'narration', text: '— 2페이즈 승리 —' },
        { who: 'jenny', text: '…왜… 왜 난 못 이겨…' }
      ]
    },
    {
      id: 'reunion',
      location: 'dimension_end',
      actors: ['romi', 'jenny', 'jenny_mom', 'jenny_dad'],
      dialog: [
        { who: 'narration', text: '차원의 문이 열리고— ✨' },
        { who: 'jenny_mom', text: '…제니야?! 우리 제니!!' },
        { who: 'jenny', text: '엄마… 아빠…?!' },
        { who: 'jenny_dad', text: '살아있었구나… 미안해…' },
        { who: 'jenny', text: '(눈물) 엄마아아아 😭' },
        { who: 'romi', text: '(미소) 다행이야… 💕' },
        { who: 'jenny', text: '로미… 미안해. 그리고… 고마워.' }
      ]
    },
    {
      id: 'ending_a',
      location: 'ion_castle',
      actors: ['romi', 'hatchu', 'heartking'],
      dialog: [
        { who: 'heartking', text: '내 딸… 진정한 공주가 됐구나.' },
        { who: 'romi', text: '아빠아아 😭' },
        { who: 'hatchu', text: '핑핑 💕' },
        { who: 'narration', text: '— 엔딩 A: 사랑으로 이긴 이야기 —' },
        { who: 'narration', text: '[스태프롤]' },
        { who: 'narration', text: '…하지만 하늘엔 아직 별이 떨어진다.' }
      ]
    }
  ],
  onComplete: {
    addCharacter: 'jenny',
    unlock: 'act4',
    giveItem: 'raven_heartwing',
    setFlag: 'ending_a_cleared',
    triggerCredits: 'ending_a'
  }
};
