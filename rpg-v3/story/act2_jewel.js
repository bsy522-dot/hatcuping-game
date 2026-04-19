// Act 2: S2 — 보석숲 + 제니 1차전
// 아자핑/꽁꽁핑/차차핑 관장 → 차원의 문 제니 1차전
window.ACT2 = {
  id: 'act2',
  title: '보석숲의 그림자',
  season: 'S2',
  unlockCondition: 'act1_done',
  bgm: 'bgm_jewel_forest',
  scenes: [
    {
      id: 'jewel_entry',
      location: 'jewel_forest_gate',
      actors: ['romi', 'hatchu'],
      dialog: [
        { who: 'romi', text: '우와… 나무가 보석이야! 💎' },
        { who: 'hatchu', text: '핑?! 하츄 핑핑~ ✨' },
        { who: 'narration', text: '그때 스쳐가는 검은 그림자—' },
        { who: 'romi', text: '…어? 방금 뭐였지?' },
        { who: 'hatchu', text: '핑… (경계)' }
      ]
    },
    {
      id: 'gym_ajaping',
      location: 'fire_gym',
      actors: ['romi', 'ajaping'],
      dialog: [
        { who: 'ajaping', text: '아자! 아자자! 🔥' },
        { who: 'romi', text: '엄청 열정적이네…' },
        { who: 'ajaping', text: '관장전이다 아자!' },
        { who: 'narration', text: '— 승리 —' },
        { who: 'ajaping', text: '아자! 불꽃 배지 가져가 아자!' }
      ]
    },
    {
      id: 'gym_kkongkkongping',
      location: 'ice_gym',
      actors: ['romi', 'kkongkkongping'],
      dialog: [
        { who: 'kkongkkongping', text: '꽁꽁… 얼려버릴 거야 ❄️' },
        { who: 'romi', text: '추워… 하지만 이길 거야!' },
        { who: 'narration', text: '— 승리 —' },
        { who: 'kkongkkongping', text: '꽁꽁… 얼음 배지…' }
      ]
    },
    {
      id: 'gym_chachaping',
      location: 'dance_gym',
      actors: ['romi', 'chachaping'],
      dialog: [
        { who: 'chachaping', text: '차차~ 리듬 타! 🎵' },
        { who: 'romi', text: '재밌겠다! 하츄핑도 춤 춰!' },
        { who: 'narration', text: '— 리듬 배틀 승리 —' },
        { who: 'chachaping', text: '차차~ 리듬 배지 챙겨!' }
      ]
    },
    {
      id: 'jenny_first',
      location: 'dimension_gate',
      actors: ['romi', 'hatchu', 'jenny'],
      dialog: [
        { who: 'jenny', text: '…드디어 왔네. 로미 공주.' },
        { who: 'romi', text: '누구야 너?! 검은 그림자?!' },
        { who: 'jenny', text: '내 이름은 제니.' },
        { who: 'jenny', text: '네 하트링… 나한테 줘.' },
        { who: 'romi', text: '싫어!! 하츄핑 가자! 💕' },
        { who: 'narration', text: '— 제니 1차전 승리 —' },
        { who: 'jenny', text: '크윽… 이 정도였다니.' },
        { who: 'jenny', text: '…난 부모님을 찾아야 해!' },
        { who: 'romi', text: '어?! 잠깐!' },
        { who: 'narration', text: '제니, 차원문으로 도주.' }
      ]
    },
    {
      id: 'monju_reveal',
      location: 'jewel_forest_camp',
      actors: ['romi', 'monju'],
      dialog: [
        { who: 'romi', text: '몬쥬 박사! 제니라는 애가!' },
        { who: 'monju', text: '제니…?! 설마 그 아이가?' },
        { who: 'romi', text: '알아?!' },
        { who: 'monju', text: '… 오래전 이모션 왕국의 사고로…' },
        { who: 'monju', text: '부모를 잃은 아이가 있었어요.' },
        { who: 'romi', text: '…제니가 그 애야?' },
        { who: 'monju', text: '확실치 않아요. 하지만 위험해요.' },
        { who: 'romi', text: '(조용히) …가여워…' }
      ]
    }
  ],
  onComplete: {
    addCharacter: 'ajaping',
    unlock: 'act3',
    giveItem: 'flame_badge',
    setFlag: 'jenny_met'
  }
};
