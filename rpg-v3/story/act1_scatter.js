// Act 1: S1 — 지구로 흩어진 티니핑 회수
// 마음마을 → 1번길 → 반짝시티(바로핑 체육관) → 감정숲
window.ACT1 = {
  id: 'act1',
  title: '흩어진 마음들',
  season: 'S1',
  unlockCondition: 'act0_done',
  bgm: 'bgm_heart_town',
  scenes: [
    {
      id: 'arrive_earth',
      location: 'heart_town',
      actors: ['romi', 'hatchu', 'monju'],
      dialog: [
        { who: 'monju', text: '(통신) 공주님! 지구 마음마을이에요!' },
        { who: 'romi', text: '우와 여기가 지구… 하늘 색이 달라 🌸' },
        { who: 'hatchu', text: '핑핑! 하츄!' },
        { who: 'monju', text: '티니핑 신호 6개 감지됐어요' },
        { who: 'romi', text: '좋아! 다 찾아서 집에 데려갈 거야 💕' }
      ]
    },
    {
      id: 'route1_catch',
      location: 'route_1',
      actors: ['romi', 'hatchu'],
      dialog: [
        { who: 'narration', text: '풀숲에서 뭔가 튀어나왔다!' },
        { who: 'romi', text: '어?! 라라핑이다!' },
        { who: 'hatchu', text: '핑! (전투태세) ✨' },
        { who: 'romi', text: '하츄핑, 부탁해!' },
        { who: 'narration', text: '— 전투 승리 —' },
        { who: 'romi', text: '라라핑 잡았다! 💕' }
      ]
    },
    {
      id: 'sparkle_city',
      location: 'sparkle_city',
      actors: ['romi', 'baroping'],
      dialog: [
        { who: 'romi', text: '와 여긴 도시네?! 번쩍번쩍 😳' },
        { who: 'baroping', text: '바로! 바로핑 체육관에 온 거 바로!' },
        { who: 'romi', text: '네?! 체육관?!' },
        { who: 'baroping', text: '초짜네 바로~ 한 판 뜨자 바로!' },
        { who: 'romi', text: '흠… 좋아! 하츄핑 가자!' }
      ]
    },
    {
      id: 'gym1_battle',
      location: 'sparkle_gym',
      actors: ['romi', 'baroping'],
      dialog: [
        { who: 'baroping', text: '내 아자핑! 나가라 바로!' },
        { who: 'romi', text: '하츄핑 보다 강해?!' },
        { who: 'narration', text: '— 체육관전 승리 —' },
        { who: 'baroping', text: '인정한다 바로… 너 재능있어 바로' },
        { who: 'baroping', text: '이거 받아! 씨앗 배지 🌱' }
      ]
    },
    {
      id: 'emotion_forest',
      location: 'emotion_forest',
      actors: ['romi', 'hatchu', 'heartking'],
      dialog: [
        { who: 'hatchu', text: '핑?! (하트링 반짝)' },
        { who: 'heartking', text: '(홀로그램) 로미야, 아빠다.' },
        { who: 'romi', text: '아빠! 나 잘 하고 있지?! 😤' },
        { who: 'heartking', text: '… 자랑스럽구나.' },
        { who: 'heartking', text: '하지만 조심해라. 숲에… 검은 그림자가.' },
        { who: 'romi', text: '검은 그림자? 누구?' },
        { who: 'heartking', text: '(통신 끊김)' },
        { who: 'romi', text: '아빠?! 아빠!!' }
      ]
    },
    {
      id: 'act1_end',
      location: 'emotion_forest_exit',
      actors: ['romi', 'hatchu', 'monju'],
      dialog: [
        { who: 'monju', text: '공주님! 다음은 보석숲이에요' },
        { who: 'romi', text: '보석숲… 반짝반짝할 거 같아 ✨' },
        { who: 'hatchu', text: '핑핑!' },
        { who: 'romi', text: '가자 하츄핑! 💕' }
      ]
    }
  ],
  onComplete: {
    addCharacter: 'laraping',
    unlock: 'act2',
    giveItem: 'seed_badge',
    setFlag: 'act1_done'
  }
};
