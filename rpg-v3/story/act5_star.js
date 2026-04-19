// Act 5: S5 — 슈팅스타 + 챔피언 (진엔딩 B)
// 별빛 고원 → 챔피언 성 → 미래의 로미 미러매치 → 레전드 행운핑/새콤핑
window.ACT5 = {
  id: 'act5',
  title: '별빛 너머의 나',
  season: 'S5',
  unlockCondition: 'act4_done',
  bgm: 'bgm_star_plateau',
  scenes: [
    {
      id: 'star_plateau',
      location: 'star_plateau',
      actors: ['romi', 'hatchu', 'haengunping'],
      dialog: [
        { who: 'romi', text: '여기가 별빛 고원… 엄청 높아 🌌' },
        { who: 'haengunping', text: '행운~ 오길 잘했네 행운!' },
        { who: 'romi', text: '헉! 레전드 행운핑!' },
        { who: 'haengunping', text: '행운~ 네 여정에 같이해 행운 🍀' },
        { who: 'hatchu', text: '핑핑 💕' }
      ]
    },
    {
      id: 'sour_trial',
      location: 'sour_cliff',
      actors: ['romi', 'saekomping'],
      dialog: [
        { who: 'saekomping', text: '새콤~ 내 시험을 통과해야 돼 새콤!' },
        { who: 'romi', text: '새콤핑?! 또 레전드?!' },
        { who: 'saekomping', text: '새콤~ 달기만 하면 안 돼 새콤' },
        { who: 'narration', text: '— 시험 배틀 승리 —' },
        { who: 'saekomping', text: '새콤~ 합격 새콤! 🍋' },
        { who: 'romi', text: '야호 레전드 둘! 💕' }
      ]
    },
    {
      id: 'champion_gate',
      location: 'champion_castle_gate',
      actors: ['romi', 'hatchu', 'monju'],
      dialog: [
        { who: 'monju', text: '(통신) 공주님… 이 성은…' },
        { who: 'romi', text: '왜 그래 몬쥬 박사?' },
        { who: 'monju', text: '시간 왜곡 감지돼요. 조심!' },
        { who: 'romi', text: '시간…? 무슨 뜻이야?' },
        { who: 'hatchu', text: '핑… (긴장)' }
      ]
    },
    {
      id: 'future_romi',
      location: 'champion_throne',
      actors: ['romi', 'hatchu', 'future_romi'],
      dialog: [
        { who: 'future_romi', text: '…왔구나, 나 자신.' },
        { who: 'romi', text: '뭐?! 너… 나야?!' },
        { who: 'future_romi', text: '미래의 로미. 실패한 나.' },
        { who: 'romi', text: '실패…?' },
        { who: 'future_romi', text: '난 하츄핑을 잃었어.' },
        { who: 'hatchu', text: '핑?! 😨' },
        { who: 'future_romi', text: '그래서 여기로 돌아왔지.' },
        { who: 'future_romi', text: '네 하트링을 가져간다.' },
        { who: 'romi', text: '…절대 안 줘! 💕' }
      ]
    },
    {
      id: 'mirror_match',
      location: 'champion_throne',
      actors: ['romi', 'future_romi'],
      dialog: [
        { who: 'future_romi', text: '내 6인 파티! 전원 각성!' },
        { who: 'romi', text: '나도 간다! 하츄핑, 달콤핑, 행운핑, 새콤핑 💕' },
        { who: 'narration', text: '— 미러매치 챔피언전 (3페이즈) —' },
        { who: 'narration', text: '— 최종 승리 —' },
        { who: 'future_romi', text: '(무릎) …져버렸어…' }
      ]
    },
    {
      id: 'true_ending',
      location: 'champion_throne',
      actors: ['romi', 'hatchu', 'future_romi'],
      dialog: [
        { who: 'romi', text: '왜 하츄핑을 잃었어?' },
        { who: 'future_romi', text: '혼자서 다 하려고 했어.' },
        { who: 'future_romi', text: '친구 말을 안 들었고… 욕심냈지.' },
        { who: 'romi', text: '…난 안 그럴게. 약속 💕' },
        { who: 'future_romi', text: '(미소) …부탁해.' },
        { who: 'narration', text: '미래의 로미가 빛이 되어 사라진다 ✨' },
        { who: 'hatchu', text: '하츄핑! (꽉 안음)' },
        { who: 'romi', text: '헤헤 우리 영원히 같이야~ 💕' }
      ]
    },
    {
      id: 'ending_b',
      location: 'ion_castle_grand',
      actors: ['romi', 'hatchu', 'heartking', 'monju', 'jenny'],
      dialog: [
        { who: 'heartking', text: '내 딸… 진짜 챔피언이다.' },
        { who: 'monju', text: '공주님 만세! 🎉' },
        { who: 'jenny', text: '로미! 나도 왔어!' },
        { who: 'romi', text: '제니! 엄마아빠는?' },
        { who: 'jenny', text: '잘 계셔~ 이제 나도 트레이너야!' },
        { who: 'hatchu', text: '핑핑핑! 💕💕💕' },
        { who: 'narration', text: '— 진엔딩 B: 별빛 너머의 약속 —' },
        { who: 'narration', text: '[진엔딩 스태프롤]' },
        { who: 'narration', text: '…New Game+ 잠금해제! ✨' }
      ]
    }
  ],
  onComplete: {
    addCharacter: 'haengunping',
    unlock: 'newgame_plus',
    giveItem: 'champion_ring',
    setFlag: 'ending_b_cleared',
    triggerCredits: 'ending_b_true'
  }
};
