// Act 0: 극장판 "사랑의 하츄핑" — 프롤로그
// 이모션 왕국 10살 생일, 짝꿍 티니핑 하츄핑과의 첫 만남
window.ACT0 = {
  id: 'act0',
  title: '사랑의 하츄핑',
  season: '극장판',
  unlockCondition: 'new_game',
  bgm: 'bgm_emotion_castle',
  scenes: [
    {
      id: 'opening',
      location: 'ion_castle',
      actors: ['romi', 'monju', 'heartking'],
      dialog: [
        { who: 'monju', text: '로미 공주님! 드디어 오늘이에요 ✨' },
        { who: 'romi', text: '헤헤 내 생일! 10살이야! 🎂' },
        { who: 'monju', text: '이모션 왕국 공주는 10살이 되면요~' },
        { who: 'monju', text: '짝꿍 티니핑을 만난답니다 💕' },
        { who: 'romi', text: '와아아 진짜?! 어디 가면 돼?!' },
        { who: 'heartking', text: '로미야. 숲은… 위험하다.' },
        { who: 'romi', text: '아빠 걱정 마! 나 공주잖아 😤' },
        { who: 'heartking', text: '…금단의 숲엔 절대 가지 마라.' }
      ]
    },
    {
      id: 'forest_entry',
      location: 'forbidden_forest_edge',
      actors: ['romi', 'monju'],
      dialog: [
        { who: 'monju', text: '공주님~ 여기까진데요…' },
        { who: 'romi', text: '몬쥬 박사! 저쪽에서 반짝반짝 했어!' },
        { who: 'monju', text: '그건 금단의 숲인데요?! 😱' },
        { who: 'romi', text: '내 짝꿍 거기 있는 거 같아!' },
        { who: 'romi', text: '(몰래 들어간다) 후후 🌸' },
        { who: 'monju', text: '공주니임~~ 돌아와요~~' }
      ]
    },
    {
      id: 'meet_hatchu',
      location: 'forbidden_forest_deep',
      actors: ['romi', 'hatchu'],
      dialog: [
        { who: 'narration', text: '풀숲이 바스락—' },
        { who: 'hatchu', text: '…흑… 핑…' },
        { who: 'romi', text: '어? 너… 다쳤어?' },
        { who: 'hatchu', text: '(경계) 피잉!! 😨' },
        { who: 'romi', text: '무서워 마! 나 나쁜 사람 아냐' },
        { who: 'hatchu', text: '…핑…?' },
        { who: 'romi', text: '너 혹시… 내 짝꿍이야? 💕' }
      ]
    },
    {
      id: 'trust_buildup',
      location: 'forbidden_forest_deep',
      actors: ['romi', 'hatchu'],
      choices: [
        {
          id: 'choice1',
          prompt: '하츄핑이 도망쳤다. 어떡하지?',
          options: [
            { text: '따라간다', affection: 2, flag: 'chase' },
            { text: '기다린다', affection: 1, flag: 'wait' },
            { text: '부른다', affection: 0, flag: 'shout' }
          ]
        },
        {
          id: 'choice2',
          prompt: '배가 고파 보여…',
          options: [
            { text: '쿠키를 준다 🍪', affection: 2, flag: 'cookie' },
            { text: '물을 준다', affection: 1, flag: 'water' },
            { text: '그냥 본다', affection: 0, flag: 'watch' }
          ]
        },
        {
          id: 'choice3',
          prompt: '아직도 경계하는 하츄핑…',
          options: [
            { text: '자장가를 부른다 🎵', affection: 3, flag: 'sing' },
            { text: '춤을 춘다', affection: 1, flag: 'dance' },
            { text: '얘기한다', affection: 1, flag: 'talk' }
          ]
        }
      ],
      dialog: [
        { who: 'hatchu', text: '…(빤히 본다)' },
        { who: 'romi', text: '괜찮아~ 천천히 와 💕' }
      ]
    },
    {
      id: 'partner_oath',
      location: 'forbidden_forest_deep',
      actors: ['romi', 'hatchu', 'monju'],
      dialog: [
        { who: 'hatchu', text: '핑… 하츄핑! ✨' },
        { who: 'romi', text: '하츄핑?! 네 이름?!' },
        { who: 'hatchu', text: '핑핑! (품에 폴짝)' },
        { who: 'romi', text: '헤헤 간지러워~ 🌸' },
        { who: 'monju', text: '공주니임~~ 찾았다아!' },
        { who: 'monju', text: '어머? 그 아이가… 짝꿍?!' },
        { who: 'romi', text: '응! 내 하츄핑이야 💕' },
        { who: 'narration', text: '하트링이 반짝— 빛났다 ✨' }
      ]
    },
    {
      id: 'ending_hook',
      location: 'ion_castle_balcony',
      actors: ['romi', 'hatchu', 'heartking'],
      dialog: [
        { who: 'heartking', text: '로미… 다치지 않아서 다행이다.' },
        { who: 'romi', text: '아빠 미안해… 근데 하츄핑 만났어!' },
        { who: 'hatchu', text: '핑핑! 💕' },
        { who: 'narration', text: '그날 밤, 하늘에서 빛이 떨어졌다…' },
        { who: 'monju', text: '공주님! 티니핑들이… 지구로?!' },
        { who: 'romi', text: '지구?! 내가 찾으러 갈게!' }
      ]
    }
  ],
  onComplete: {
    addCharacter: 'hatchu',
    unlock: 'act1',
    giveItem: 'heart_ring',
    setFlag: 'prologue_done'
  }
};
