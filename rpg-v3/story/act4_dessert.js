// Act 4: S4 — 거울차원 디저트 (엔딩A 이후)
// 매직슈가볼 도난 → 샤샤핑/포실핑/말랑핑 → 거울차원 파티시에 관장 → 레전드 달콤핑
window.ACT4 = {
  id: 'act4',
  title: '달콤한 거울의 비밀',
  season: 'S4',
  unlockCondition: 'ending_a_cleared',
  bgm: 'bgm_dessert_town',
  scenes: [
    {
      id: 'sugar_stolen',
      location: 'dessert_town',
      actors: ['romi', 'hatchu', 'monju'],
      dialog: [
        { who: 'romi', text: '우와 마카롱 집이야! 🍪💕' },
        { who: 'hatchu', text: '핑핑~ 하츄!' },
        { who: 'monju', text: '(통신) 공주님! 큰일이에요!' },
        { who: 'romi', text: '응? 뭐?!' },
        { who: 'monju', text: '매직슈가볼이 도난당했어요!' },
        { who: 'romi', text: '그거 없으면 디저트 다 맛 없어지는…?!' }
      ]
    },
    {
      id: 'sweet_trio',
      location: 'cake_plaza',
      actors: ['romi', 'shasha', 'posil', 'mallang'],
      dialog: [
        { who: 'shasha', text: '샤샤~ 도와줄게 샤샤!' },
        { who: 'posil', text: '포실포실~ 나도!' },
        { who: 'mallang', text: '말랑… 같이 가…' },
        { who: 'romi', text: '와아 셋 다?! 고마워 💕' },
        { who: 'hatchu', text: '핑! 팀워크!' }
      ]
    },
    {
      id: 'mirror_entry',
      location: 'mirror_dessert',
      actors: ['romi', 'hatchu'],
      dialog: [
        { who: 'romi', text: '거울이… 일렁인다?' },
        { who: 'narration', text: '거울 속으로 빨려들어간다—' },
        { who: 'romi', text: '꺄악! 😱' },
        { who: 'hatchu', text: '하츄핑?!' },
        { who: 'romi', text: '여긴… 거꾸로 된 디저트 동네?!' }
      ]
    },
    {
      id: 'gym_patissier',
      location: 'mirror_kitchen',
      actors: ['romi', 'patissier'],
      dialog: [
        { who: 'patissier', text: '후후후… 매직슈가볼은 내 것.' },
        { who: 'romi', text: '너였구나! 내놔!' },
        { who: 'patissier', text: '내 케이크 군단이 상대해주지!' },
        { who: 'narration', text: '— 관장전 승리 —' },
        { who: 'patissier', text: '내 레시피가… 졌다고…?!' },
        { who: 'romi', text: '슈가볼 돌려줘 💕' }
      ]
    },
    {
      id: 'meet_dalkom',
      location: 'legend_bakery',
      actors: ['romi', 'dalkomping'],
      dialog: [
        { who: 'dalkomping', text: '달콤~ 잘 싸웠어 달콤 🍰' },
        { who: 'romi', text: '헉 혹시… 레전드 달콤핑?!' },
        { who: 'dalkomping', text: '달콤~ 네 마음 달콤해서 왔어' },
        { who: 'hatchu', text: '핑?! 하츄핑!!' },
        { who: 'dalkomping', text: '달콤~ 함께 가자 달콤!' },
        { who: 'romi', text: '레전드가 내 편이라니! 💕✨' }
      ]
    },
    {
      id: 'star_falling',
      location: 'dessert_town_night',
      actors: ['romi', 'hatchu', 'monju'],
      dialog: [
        { who: 'narration', text: '밤하늘— 별이 떨어진다. ⭐' },
        { who: 'romi', text: '와… 별똥별이 엄청 많아!' },
        { who: 'monju', text: '공주님, 이건 평범한 게 아녜요…' },
        { who: 'monju', text: '별빛 고원에서 뭔가 부르고 있어요!' },
        { who: 'romi', text: '좋아! 하츄핑, 달콤핑 가자 💕' }
      ]
    }
  ],
  onComplete: {
    addCharacter: 'dalkomping',
    unlock: 'act5',
    giveItem: 'magic_sugar_ball',
    setFlag: 'act4_done'
  }
};
