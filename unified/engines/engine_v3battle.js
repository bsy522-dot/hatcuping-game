// ============================================================
// UNIFIED v4 - V3 BATTLE ENGINE (로미 중심 재설계)
// rpg-v3/systems/battle.js + ui/battle_ui.js 기반.
// 핵심 변경:
//   - 플레이어 = 로미 (makeRomi()로 생성)
//   - 파트너(티니핑)는 직접 공격 X, "파트너" 커맨드로 서포트만
//   - Act7만 opts.allowCoopAttack=true로 파트너 공동공격
// API:
//   V3Battle.start(romi, enemy, opts)
//     opts: { partner, onVictory, onDefeat, allowCapture, isBoss,
//             bossPhase2Lv, allowCoopAttack, wild }
// ============================================================
(function(){
  'use strict';

  // ===== 상태 =====
  const S = {
    active: false,
    romi: null,
    enemy: null,
    partner: null,        // {id,name,...} or null
    partnerEff: null,     // PARTNER_EFFECTS[id]
    partnerUsedThisBattle: false,
    log: [],
    mode: 'commands',     // commands | skills | bag | capture | result
    hitAreas: [],
    turn: 1,
    onVictory: null,
    onDefeat: null,
    opts: null,
    result: null,         // {kind:'win'|'lose', ...}
    // 애니메이션 타이머
    fxPlayerAtk: 0,
    fxEnemyHurt: 0,
    fxEnemyAtk: 0,
    fxPlayerHurt: 0,
    frameT: 0,
    // 파트너 상태 버프/디버프
    tempEnemyAccMult: 1.0,      // 파트너가 깎은 명중률
    tempEnemyAccTurns: 0,
    tempEnemyAtkMult: 1.0,
    tempEnemyAtkTurns: 0,
    tempEnemySpdMult: 1.0,
    tempCritBonus: 0,
    tempCritTurns: 0,
    tempDefPen: 0,
    tempDefPenTurns: 0,
    tempShieldOnce: 0,
    // 보스 2페이즈
    bossPhase: 1,
    bossPhase2Lv: 0
  };

  // ===== 전투 커맨드 정의 =====
  const COMMANDS = [
    { id:'fight',   label:'싸우기',    color:'#FF6B9D', icon:'[검]' },
    { id:'partner', label:'파트너',    color:'#4FC3F7', icon:'[핑]' },
    { id:'bag',     label:'가방',      color:'#66BB6A', icon:'[봉]' },
    { id:'run',     label:'도망',      color:'#FFD54F', icon:'[달]' }
  ];

  // ===== 공용 헬퍼 =====
  function log(msg){
    S.log.push(msg);
    if(S.log.length > 5) S.log.shift();
    console.log('[V3Battle]', msg);
  }
  function roundRect(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }
  function getSpriteForName(name){
    const MAP = {
      '로미':'rs', '하츄핑':'hs', '하츄핑_pose':'hp',
      '바로핑':'ba', '차차핑':'ch', '꽁꽁핑':'kk', '부끄핑':'bk',
      '라라핑':'la', '트러핑':'ts', '스틱핑':'stk',
      '리암 왕자':'liam', '몬쥬박사':'monju'
    };
    const key = MAP[name];
    return (key && window.IM && window.IM[key]) ? window.IM[key] : null;
  }

  // ===== 데미지 공식 (rpg-v3 그대로) =====
  // Math.max(1, Math.floor((lvMod * power * ratio) / 10) + 1)
  //   lvMod = 2*lv/5 + 2,  ratio = atk / Math.max(20, def+20)
  function calcDamage(attacker, defender, skill, opts){
    opts = opts || {};
    const power = skill.power || 40;
    const lv    = attacker.lv || 1;
    const lvMod = (2*lv/5) + 2;
    let atk = attacker.atk || 10;
    let def = defender.def || 10;

    // 공격 버프 (로미 희망 스킬 등)
    (attacker.buffs||[]).forEach(b => {
      if(b.stat==='atk') atk = Math.floor(atk * b.mult);
    });
    // 파트너 효과: 적 공격력 감소 (디펜더가 적일 때는 적용 X / 로미가 공격자면 적 defense에만)
    // 관통(pierce / defPen) 처리
    if(skill.pierce || opts.defPenetration){
      def = Math.floor(def * 0.5);
    }
    if(attacker.isRomi && S.tempDefPenTurns > 0){
      def = Math.floor(def * (1 - S.tempDefPen));
    }

    const ratio = atk / Math.max(20, def + 20);
    const base  = Math.max(1, Math.floor((lvMod * power * ratio) / 10) + 1);
    const rng   = 0.85 + Math.random()*0.15;
    let dmg = Math.floor(base * rng);

    // 타입 상성 (types.js 있으면)
    if(skill.type && defender.type && window.getTypeMultiplier){
      let tm = 1.0;
      const dts = Array.isArray(defender.type) ? defender.type : [defender.type];
      dts.forEach(t => { tm *= window.getTypeMultiplier(skill.type, t); });
      dmg = Math.floor(dmg * tm);
    }

    // 크리티컬
    let critChance = 0.1;
    if(attacker.isRomi && S.tempCritTurns > 0) critChance += S.tempCritBonus;
    const crit = Math.random() < critChance;
    if(crit) dmg = Math.floor(dmg * 1.5);

    return { dmg: Math.max(1, dmg), crit };
  }

  // ===== 공개 API =====
  function start(romi, enemy, opts){
    opts = opts || {};
    S.active = true;
    S.romi = romi || (window.makeRomi ? window.makeRomi() : null);
    if(!S.romi){
      console.error('[V3Battle] 로미 생성 실패');
      S.active = false;
      return;
    }
    S.enemy = enemy;
    S.partner = opts.partner || null;
    S.partnerEff = S.partner && window.getPartnerEffect ? window.getPartnerEffect(S.partner) : null;
    S.partnerUsedThisBattle = false;
    S.log = [];
    S.mode = 'commands';
    S.hitAreas = [];
    S.turn = 1;
    S.onVictory = opts.onVictory || null;
    S.onDefeat  = opts.onDefeat  || null;
    S.opts = opts;
    S.result = null;
    S.frameT = 0;
    S.tempEnemyAccMult = 1.0; S.tempEnemyAccTurns = 0;
    S.tempEnemyAtkMult = 1.0; S.tempEnemyAtkTurns = 0;
    S.tempEnemySpdMult = 1.0;
    S.tempCritBonus = 0; S.tempCritTurns = 0;
    S.tempDefPen = 0; S.tempDefPenTurns = 0;
    S.tempShieldOnce = 0;
    S.bossPhase = 1;
    S.bossPhase2Lv = opts.bossPhase2Lv || 0;

    // 로미 버프 초기화
    S.romi.buffs = [];

    // 패시브 파트너 효과 적용
    if(S.partnerEff && S.partnerEff.passive){
      const p = S.partnerEff.passive;
      if(p.enemySpd) S.tempEnemySpdMult = 1 + p.enemySpd;
      if(p.crit)     { S.tempCritBonus = p.crit; S.tempCritTurns = 99; }
      if(p.shield)   S.tempShieldOnce = p.shield;
      if(p.hpRegen)  S._hpRegen = p.hpRegen;   // 비공개 필드
    } else {
      S._hpRegen = 0;
    }

    log((opts.wild!==false ? '야생의 ' : '') + (enemy.name||'적') + '이(가) 나타났다!');
    if(S.partner) log('파트너: ' + (S.partner.name||'?') + ' 대기 중');
    if(opts.isBoss) log('[보스전] 긴장하라...');

    if(window.STATE) window.STATE.battle = { player: S.romi, enemy: S.enemy, active: true };
  }

  // ===== 프레임 업데이트 =====
  function update(){
    if(!S.active) return;
    S.frameT++;
    if(S.fxPlayerAtk > 0)  S.fxPlayerAtk--;
    if(S.fxEnemyHurt > 0)  S.fxEnemyHurt--;
    if(S.fxEnemyAtk > 0)   S.fxEnemyAtk--;
    if(S.fxPlayerHurt > 0) S.fxPlayerHurt--;
  }

  // ===== 렌더 =====
  function render(ctx, W, H){
    if(!S.active){
      ctx.fillStyle = '#1a0a2e';
      ctx.fillRect(0, 0, W, H);
      return;
    }
    // 배경
    const bgImg = window.IM && window.IM.bg_forest;
    if(bgImg){
      ctx.drawImage(bgImg, 0, 0, W, H);
      ctx.fillStyle = 'rgba(10,5,21,0.55)';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = '#2a1540';
      ctx.fillRect(0, 0, W, H);
    }

    // 플랫폼
    ctx.fillStyle = 'rgba(255,107,157,0.25)';
    ctx.beginPath(); ctx.ellipse(W-100, 260, 100, 18, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,213,79,0.25)';
    ctx.beginPath(); ctx.ellipse(100, 490, 110, 20, 0, 0, Math.PI*2); ctx.fill();

    const t = S.frameT * 0.1;

    // === 적 (상단 우측) ===
    const enemyHurt = S.fxEnemyHurt > 0;
    const eBob = Math.sin(t)*3;
    const eShake = enemyHurt ? (Math.random()-0.5)*8 : 0;
    const ex = W-160 + eShake, ey = 150 + eBob;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(W-100, 262, 44, 8, 0, 0, Math.PI*2); ctx.fill();
    const eImg = getSpriteForName(S.enemy.name);
    if(eImg){
      if(enemyHurt) ctx.filter = 'brightness(1.8) hue-rotate(-30deg)';
      ctx.drawImage(eImg, ex, ey, 120, 120);
      ctx.filter = 'none';
    } else {
      ctx.fillStyle = '#FF6B9D';
      ctx.beginPath(); ctx.arc(W-100, 210+eBob, 40, 0, Math.PI*2); ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px "Jua", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(S.enemy.name + (S.enemy.lv ? ' Lv.'+S.enemy.lv : ''), W-100, 290);

    // === 로미 (하단 좌측) ===
    const playerAtk = S.fxPlayerAtk > 0;
    const playerHurt = S.fxPlayerHurt > 0;
    const pBob = Math.sin(t+1)*3;
    const pJump = playerAtk ? -15 : 0;
    const pShake = playerHurt ? (Math.random()-0.5)*6 : 0;
    const px = 40 + pShake, py = 380 + pBob + pJump;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(100, 492, 50, 10, 0, 0, Math.PI*2); ctx.fill();
    const rImg = (window.IM && window.IM.rs) || null;
    if(rImg){
      if(playerHurt) ctx.filter = 'brightness(1.8) hue-rotate(30deg)';
      ctx.drawImage(rImg, px, py, 130, 130);
      ctx.filter = 'none';
    } else {
      ctx.fillStyle = '#FFD54F';
      ctx.beginPath(); ctx.arc(100, 430+pBob, 45, 0, Math.PI*2); ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.fillText(S.romi.name + ' Lv.'+(S.romi.lv||1), 100, 530);

    // === 파트너 (로미 옆 작게) ===
    if(S.partner){
      const partImg = getSpriteForName(S.partner.name);
      const ppx = 180, ppy = 430 + Math.sin(t+2)*3;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(ppx+30, ppy+62, 26, 5, 0, 0, Math.PI*2); ctx.fill();
      if(partImg){
        ctx.drawImage(partImg, ppx, ppy, 60, 60);
      } else {
        ctx.fillStyle = '#4FC3F7';
        ctx.beginPath(); ctx.arc(ppx+30, ppy+30, 22, 0, Math.PI*2); ctx.fill();
      }
      ctx.fillStyle = '#4FC3F7';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(S.partner.name, ppx+30, ppy-4);
    }

    // 공격 이펙트
    if(playerAtk){
      ctx.strokeStyle = '#FFD54F'; ctx.lineWidth = 3;
      for(let i=0;i<4;i++){
        ctx.beginPath();
        ctx.arc(W-100, 210+eBob, 50+i*8, 0, Math.PI*2);
        ctx.stroke();
      }
    }

    // === HP 바 ===
    drawHpBar(ctx, 20, 40, 200, 18, S.enemy.hp, S.enemy.maxHp, '#FF6B9D');
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = '12px sans-serif';
    ctx.fillText(S.enemy.name+' HP '+S.enemy.hp+'/'+S.enemy.maxHp, 20, 36);

    drawHpBar(ctx, 20, H-200, 260, 18, S.romi.hp, S.romi.maxHp, '#66BB6A');
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = '12px sans-serif';
    ctx.fillText(S.romi.name+' HP '+S.romi.hp+'/'+S.romi.maxHp, 20, H-205);

    // === 로그 박스 ===
    const logY = H - 180;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    roundRect(ctx, 10, logY, W-20, 40, 8);
    ctx.fill();
    ctx.strokeStyle = '#FFD54F'; ctx.lineWidth = 1.5;
    roundRect(ctx, 10, logY, W-20, 40, 8); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    const lastLogs = S.log.slice(-2);
    lastLogs.forEach((l, i) => ctx.fillText(l, 18, logY+16+i*14));

    // === 커맨드/스킬/가방 영역 ===
    if(S.mode === 'commands') drawCommands(ctx, W, H);
    else if(S.mode === 'skills') drawSkills(ctx, W, H);
    else if(S.mode === 'bag') drawBag(ctx, W, H);
    else if(S.mode === 'result') drawResult(ctx, W, H);
  }

  function drawHpBar(ctx, x, y, w, h, cur, max, color){
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    roundRect(ctx, x, y, w, h, 4); ctx.fill();
    const ratio = Math.max(0, Math.min(1, cur/Math.max(1,max)));
    ctx.fillStyle = color;
    roundRect(ctx, x+1, y+1, (w-2)*ratio, h-2, 4); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
    roundRect(ctx, x, y, w, h, 4); ctx.stroke();
  }

  function drawCommands(ctx, W, H){
    S.hitAreas = [];
    const areaH = 130;
    const areaY = H - areaH;
    ctx.fillStyle = 'rgba(42,21,64,0.95)';
    ctx.fillRect(0, areaY, W, areaH);
    ctx.strokeStyle = '#FF6B9D'; ctx.lineWidth = 2;
    ctx.strokeRect(0, areaY+0.5, W, areaH);

    // 2x2 그리드
    const cellW = (W - 24) / 2;
    const cellH = (areaH - 24) / 2;
    COMMANDS.forEach((c, i) => {
      const col = i % 2, row = Math.floor(i/2);
      const cx = 8 + col*(cellW+8);
      const cy = areaY + 8 + row*(cellH+8);
      // 파트너 없으면 'partner' 비활성
      const disabled = (c.id === 'partner') && (!S.partner || S.partnerUsedThisBattle);
      ctx.fillStyle = disabled ? 'rgba(120,120,120,0.5)' : c.color;
      roundRect(ctx, cx, cy, cellW, cellH, 12); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      roundRect(ctx, cx, cy, cellW, cellH, 12); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px "Jua", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.icon + ' ' + c.label, cx+cellW/2, cy+cellH/2+6);
      if(!disabled){
        S.hitAreas.push({ x:cx, y:cy, w:cellW, h:cellH, id:c.id, kind:'command' });
      }
    });
  }

  function drawSkills(ctx, W, H){
    S.hitAreas = [];
    const areaH = 150;
    const areaY = H - areaH;
    ctx.fillStyle = 'rgba(42,21,64,0.97)';
    ctx.fillRect(0, areaY, W, areaH);

    const skills = (S.romi.skills || []).slice(0, 4);
    const cellW = (W - 24) / 2;
    const cellH = (areaH - 42) / 2;
    const SKILL_COLOR = { love:'#FF6B9D', courage:'#EF5350', honesty:'#4FC3F7', hope:'#FFD54F' };
    for(let i=0; i<4; i++){
      const sk = skills[i];
      const col = i % 2, row = Math.floor(i/2);
      const cx = 8 + col*(cellW+8);
      const cy = areaY + 8 + row*(cellH+8);
      ctx.fillStyle = sk ? (SKILL_COLOR[sk.id]||'#FF6B9D') : 'rgba(255,255,255,0.08)';
      roundRect(ctx, cx, cy, cellW, cellH, 10); ctx.fill();
      ctx.strokeStyle = sk ? '#fff' : '#555'; ctx.lineWidth = 2;
      roundRect(ctx, cx, cy, cellW, cellH, 10); ctx.stroke();
      if(sk){
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px "Jua", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(sk.name, cx+10, cy+20);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '11px sans-serif';
        ctx.fillText('위력 '+(sk.power||'-')+' / '+(sk.type||''), cx+10, cy+36);
        ctx.textAlign = 'right';
        ctx.fillText('PP '+(sk.pp||0)+'/'+(sk.maxPp||0), cx+cellW-10, cy+cellH-8);
        S.hitAreas.push({ x:cx, y:cy, w:cellW, h:cellH, id:i, kind:'skill' });
      }
    }
    // 뒤로
    const bx = W - 90, by = areaY + areaH - 30;
    ctx.fillStyle = '#2a1540';
    roundRect(ctx, bx, by, 80, 24, 6); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('< 뒤로', bx+40, by+16);
    S.hitAreas.push({ x:bx, y:by, w:80, h:24, id:'back', kind:'nav' });
  }

  function drawBag(ctx, W, H){
    S.hitAreas = [];
    const areaH = 150;
    const areaY = H - areaH;
    ctx.fillStyle = 'rgba(42,21,64,0.97)';
    ctx.fillRect(0, areaY, W, areaH);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px "Jua", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('가방 - 회복/포획', 14, areaY+20);

    const items = Object.entries((window.STATE && window.STATE.items) || {})
      .map(([k,v]) => ({ id:k, name:k, count:v }));
    if(items.length === 0){
      ctx.fillStyle = '#aaa';
      ctx.font = '13px sans-serif';
      ctx.fillText('(가방이 비어있습니다)', 14, areaY+50);
    } else {
      items.slice(0,4).forEach((it, i) => {
        const ry = areaY + 32 + i*22;
        ctx.fillStyle = 'rgba(102,187,106,0.25)';
        roundRect(ctx, 10, ry, W-20, 20, 4); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(it.name, 16, ry+15);
        ctx.textAlign = 'right';
        ctx.fillText('x '+it.count, W-16, ry+15);
        S.hitAreas.push({ x:10, y:ry, w:W-20, h:20, id:it.id, kind:'item' });
      });
    }
    // 뒤로
    const bx = W - 90, by = areaY + areaH - 30;
    ctx.fillStyle = '#2a1540';
    roundRect(ctx, bx, by, 80, 24, 6); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('< 뒤로', bx+40, by+16);
    S.hitAreas.push({ x:bx, y:by, w:80, h:24, id:'back', kind:'nav' });
  }

  function drawResult(ctx, W, H){
    S.hitAreas = [];
    const r = S.result || {};
    ctx.fillStyle = 'rgba(10,5,21,0.75)';
    ctx.fillRect(0,0,W,H);
    const bw = 340, bh = 260;
    const bx = (W-bw)/2, by = (H-bh)/2;
    ctx.fillStyle = '#fff';
    roundRect(ctx, bx, by, bw, bh, 16); ctx.fill();
    ctx.strokeStyle = r.kind==='win' ? '#FFD54F' : '#7A5C9F';
    ctx.lineWidth = 3;
    roundRect(ctx, bx, by, bw, bh, 16); ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = r.kind==='win' ? '#FF6B9D' : '#5D2C7A';
    ctx.font = 'bold 24px "Jua", sans-serif';
    ctx.fillText(r.kind==='win' ? '승리!' : '쓰러졌다...', W/2, by+42);

    ctx.fillStyle = '#2a1540';
    ctx.font = '15px "Jua", sans-serif';
    const lines = r.lines || [];
    lines.forEach((ln, i) => ctx.fillText(ln, W/2, by+80+i*24));

    // 확인 버튼
    const bty = by + bh - 50;
    ctx.fillStyle = '#FF6B9D';
    roundRect(ctx, bx+bw/2-60, bty, 120, 36, 10); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px "Jua", sans-serif';
    ctx.fillText('확인', W/2, bty+23);
    S.hitAreas.push({ x:bx+bw/2-60, y:bty, w:120, h:36, id:'ok', kind:'result' });
  }

  // ===== 입력 =====
  function handleInput(x, y, kind){
    if(!S.active) return;
    if(kind === 'key'){
      // 키보드 단축: Enter=fight, Esc=back
      if(x === 'Enter' || x === ' '){
        if(S.mode === 'commands') handleCommandPress('fight');
        else if(S.mode === 'result') closeResult();
        return;
      }
      if(x === 'Escape'){
        if(S.mode === 'skills' || S.mode === 'bag') S.mode = 'commands';
        return;
      }
      return;
    }
    // 터치/마우스
    for(const h of S.hitAreas){
      if(x>=h.x && x<=h.x+h.w && y>=h.y && y<=h.y+h.h){
        handleHit(h);
        return;
      }
    }
  }

  function handleHit(h){
    if(h.kind === 'command') handleCommandPress(h.id);
    else if(h.kind === 'skill') useSkill(h.id);
    else if(h.kind === 'nav' && h.id === 'back') S.mode = 'commands';
    else if(h.kind === 'item') useItem(h.id);
    else if(h.kind === 'result' && h.id === 'ok') closeResult();
  }

  function handleCommandPress(id){
    if(id === 'fight'){ S.mode = 'skills'; return; }
    if(id === 'bag'){ S.mode = 'bag'; return; }
    if(id === 'partner'){ usePartner(); return; }
    if(id === 'run'){
      if(S.opts && S.opts.isBoss){
        log('보스로부터 도망칠 수 없다!');
        return;
      }
      log('로미는 도망쳤다!');
      finalize('lose', { reason:'run' });
      return;
    }
  }

  // ===== 로미 스킬 사용 =====
  function useSkill(idx){
    const sk = S.romi.skills[idx];
    if(!sk) return;
    if((sk.pp||0) <= 0){
      log(sk.name + ': PP가 부족하다!');
      return;
    }
    sk.pp--;
    S.mode = 'commands';
    S.fxPlayerAtk = 12;

    // 버프 스킬 (희망)
    if(sk.buff){
      for(const key of Object.keys(sk.buff)){
        if(key==='turns') continue;
        S.romi.buffs.push({ stat:key, mult:sk.buff[key], turns:sk.buff.turns||3 });
      }
      log(S.romi.name+'의 ' + sk.name + '! 공격력 상승!');
      afterPlayerTurn();
      return;
    }

    // 공격/치유 스킬
    const r = calcDamage(S.romi, S.enemy, sk);
    S.enemy.hp = Math.max(0, S.enemy.hp - r.dmg);
    S.fxEnemyHurt = 18;
    log(S.romi.name+'의 ' + sk.name + '! ' + r.dmg + ' 데미지'+(r.crit?' (급소!)':''));

    // 치유 스킬 (사랑의 파동)
    if(sk.heal){
      const healAmt = Math.floor(S.romi.maxHp * sk.heal);
      S.romi.hp = Math.min(S.romi.maxHp, S.romi.hp + healAmt);
      log(S.romi.name+' HP +' + healAmt + ' 회복!');
    }

    if(S.enemy.hp <= 0){
      // 보스 2페이즈 체크
      if(S.opts && S.opts.isBoss && S.bossPhase === 1 && S.bossPhase2Lv > 0){
        S.bossPhase = 2;
        log('['+S.enemy.name+'] 진정한 힘을 드러낸다...');
        // 페이즈2: lv 상승 + HP 풀회복 + 스탯 1.5배
        S.enemy.lv = S.bossPhase2Lv;
        S.enemy.atk = Math.floor((S.enemy.atk||20) * 1.5);
        S.enemy.def = Math.floor((S.enemy.def||20) * 1.3);
        S.enemy.maxHp = Math.floor((S.enemy.maxHp||50) * 1.5);
        S.enemy.hp = S.enemy.maxHp;
        afterPlayerTurn();
        return;
      }
      victory();
      return;
    }
    afterPlayerTurn();
  }

  // ===== 파트너 사용 =====
  function usePartner(){
    if(!S.partner || !S.partnerEff){
      log('파트너가 없다!');
      return;
    }
    if(S.partnerUsedThisBattle){
      log('파트너는 이미 이번 전투에 서포트했다!');
      return;
    }
    S.partnerUsedThisBattle = true;
    const eff = S.partnerEff.onSupport || {};
    log(eff.msg || (S.partner.name + '의 서포트!'));
    // 즉시 힐
    if(eff.healNow){
      const amt = Math.floor(S.romi.maxHp * eff.healNow);
      S.romi.hp = Math.min(S.romi.maxHp, S.romi.hp + amt);
    }
    if(eff.heal){
      S.romi.hp = Math.min(S.romi.maxHp, S.romi.hp + eff.heal);
    }
    // 적 명중률 다운
    if(eff.acc){
      S.tempEnemyAccMult = 1 + eff.acc;
      S.tempEnemyAccTurns = eff.turns || 3;
    }
    // 적 공격력 다운
    if(eff.atkDown){
      S.tempEnemyAtkMult = 1 + eff.atkDown;
      S.tempEnemyAtkTurns = eff.turns || 3;
    }
    // 크리 버프
    if(eff.crit){
      S.tempCritBonus = eff.crit;
      S.tempCritTurns = eff.turns || 2;
    }
    // 방어 관통 버프
    if(eff.defPen){
      S.tempDefPen = eff.defPen;
      S.tempDefPenTurns = eff.turns || 2;
    }
    // 로미 속도 버프
    if(eff.spdBuff){
      S.romi.buffs.push({ stat:'spd', mult:eff.spdBuff, turns:eff.turns||3 });
    }
    // 얼림 (적 스킵)
    if(eff.freeze && Math.random() < eff.freeze){
      S.enemy.status = 'freeze';
      log(S.enemy.name + '이(가) 얼어붙었다!');
    }
    // Act7 특수: 하츄핑 공동공격
    if(S.opts && S.opts.allowCoopAttack && (S.partner.name === '하츄핑')){
      const coopSkill = { name:'하츄핑 하트 블래스트', power:80, type:'사랑' };
      const r = calcDamage(S.partner, S.enemy, coopSkill);
      S.enemy.hp = Math.max(0, S.enemy.hp - r.dmg);
      S.fxEnemyHurt = 18;
      log('하츄핑의 ' + coopSkill.name + '! ' + r.dmg + ' 데미지!');
      if(S.enemy.hp <= 0){ victory(); return; }
    }
    afterPlayerTurn();
  }

  // ===== 가방 아이템 =====
  function useItem(itemId){
    const items = (window.STATE && window.STATE.items) || {};
    if(!items[itemId] || items[itemId] <= 0){
      log('아이템이 없다!');
      return;
    }
    const lname = itemId.toLowerCase();
    // 포획 아이템
    if(lname.includes('하트') || lname.includes('heart') || itemId === '사랑의하트'){
      if(!(S.opts && S.opts.allowCapture)){
        log('이 전투에서는 포획할 수 없다!');
        return;
      }
      const hpRatio = S.enemy.hp / Math.max(1, S.enemy.maxHp);
      const rate = 0.3 + (1 - hpRatio) * 0.5;
      items[itemId]--;
      if(Math.random() < rate){
        log(S.enemy.name + '을(를) 포획했다!');
        if(window.STATE){
          window.STATE.pokedex = window.STATE.pokedex || { seen:{}, caught:{} };
          window.STATE.pokedex.caught[S.enemy.name] = true;
          window.STATE.partners = window.STATE.partners || [];
          // enemy를 partner화
          window.STATE.partners.push({
            id: S.enemy.name, name: S.enemy.name,
            lv: S.enemy.lv||5, hp: S.enemy.maxHp, maxHp: S.enemy.maxHp,
            atk: S.enemy.atk, def: S.enemy.def, spd: S.enemy.spd,
            skills: S.enemy.skills||[], type: S.enemy.type
          });
        }
        finalize('win', { captured:true });
        return;
      } else {
        log('포획 실패! 하트가 튕겨나왔다.');
      }
    } else {
      // 회복류
      const healAmt = 30;
      items[itemId]--;
      S.romi.hp = Math.min(S.romi.maxHp, S.romi.hp + healAmt);
      log(itemId + ' 사용! HP +' + healAmt);
    }
    S.mode = 'commands';
    afterPlayerTurn();
  }

  // ===== 턴 종료 후 적 턴 =====
  function afterPlayerTurn(){
    // 적 HP 0이면 이미 처리됨
    if(S.enemy.hp <= 0){ victory(); return; }
    // 파트너 HP 회복 (패시브)
    if(S._hpRegen){
      const hpBefore = S.romi.hp;
      S.romi.hp = Math.min(S.romi.maxHp, S.romi.hp + S._hpRegen);
      if(S.romi.hp > hpBefore) log((S.partner&&S.partner.name||'파트너') + '의 회복 +' + (S.romi.hp - hpBefore));
    }
    // 약간의 딜레이 후 적 턴
    setTimeout(enemyTurn, 350);
  }

  function enemyTurn(){
    if(!S.active) return;
    if(S.enemy.hp <= 0){ victory(); return; }
    // 얼림 체크
    if(S.enemy.status === 'freeze'){
      log(S.enemy.name + '이(가) 얼어서 움직이지 못한다!');
      if(Math.random() < 0.3){
        S.enemy.status = null;
        log(S.enemy.name + '의 얼음이 녹았다!');
      }
      endOfRound();
      return;
    }
    // 적 스킬 선택
    const skills = S.enemy.skills && S.enemy.skills.length
      ? S.enemy.skills
      : [{ name:'공격', power:40, type:(S.enemy.type&&S.enemy.type[0])||'어둠' }];
    let pick = skills[Math.floor(Math.random()*skills.length)];
    if(typeof pick === 'string') pick = { name:pick, power:40, type:(S.enemy.type&&S.enemy.type[0])||'어둠' };

    // 명중률 체크 (파트너 효과)
    if(S.tempEnemyAccTurns > 0 && Math.random() > S.tempEnemyAccMult){
      log(S.enemy.name + '의 공격은 빗나갔다!');
      S.fxEnemyAtk = 12;
      endOfRound();
      return;
    }

    // 공격력 감소 버프
    const atkMult = S.tempEnemyAtkTurns > 0 ? S.tempEnemyAtkMult : 1.0;
    const tmpAtk = S.enemy.atk;
    S.enemy.atk = Math.floor(tmpAtk * atkMult);

    const r = calcDamage(S.enemy, S.romi, pick);

    S.enemy.atk = tmpAtk;   // 복원
    let dmg = r.dmg;

    // 하츄핑 쉴드
    if(S.tempShieldOnce > 0){
      const reduce = Math.floor(dmg * S.tempShieldOnce);
      dmg -= reduce;
      log('하츄핑의 하트 쉴드! 데미지 -' + reduce);
      S.tempShieldOnce = 0;
    }

    S.romi.hp = Math.max(0, S.romi.hp - dmg);
    S.fxPlayerHurt = 18; S.fxEnemyAtk = 12;
    log(S.enemy.name+'의 ' + (pick.name||'공격') + '! ' + dmg + ' 데미지'+(r.crit?' (급소!)':''));

    if(S.romi.hp <= 0){
      defeat();
      return;
    }
    endOfRound();
  }

  function endOfRound(){
    S.turn++;
    // 버프/디버프 틱다운
    if(S.tempEnemyAccTurns > 0){ S.tempEnemyAccTurns--; if(S.tempEnemyAccTurns===0) S.tempEnemyAccMult = 1.0; }
    if(S.tempEnemyAtkTurns > 0){ S.tempEnemyAtkTurns--; if(S.tempEnemyAtkTurns===0) S.tempEnemyAtkMult = 1.0; }
    if(S.tempCritTurns > 0 && S.tempCritTurns < 99) S.tempCritTurns--;
    if(S.tempDefPenTurns > 0) S.tempDefPenTurns--;
    S.romi.buffs = (S.romi.buffs||[]).map(b => Object.assign({}, b, { turns: b.turns-1 })).filter(b => b.turns > 0);
  }

  // ===== 승패 처리 =====
  function victory(){
    const enemyName = S.enemy.name;
    const xpGain = 15 + (S.enemy.lv||5)*3;
    S.romi.xp = (S.romi.xp||0) + xpGain;
    const levelUps = [];
    while(S.romi.xp >= S.romi.lv * 10){
      S.romi.xp -= S.romi.lv * 10;
      S.romi.lv++;
      const def = window.ROMI_DEF;
      S.romi.maxHp += def.growth.hp; S.romi.hp = S.romi.maxHp;
      S.romi.atk  += def.growth.atk;
      S.romi.def  += def.growth.def;
      S.romi.spd  += def.growth.spd;
      levelUps.push(S.romi.lv);
    }
    // STATE 동기화
    if(window.STATE && window.STATE.romi){
      Object.assign(window.STATE.romi, {
        lv: S.romi.lv, xp: S.romi.xp,
        hp: S.romi.hp, maxHp: S.romi.maxHp,
        atk: S.romi.atk, def: S.romi.def, spd: S.romi.spd
      });
      window.STATE.pokedex = window.STATE.pokedex || { seen:{}, caught:{} };
      window.STATE.pokedex.seen[enemyName] = true;
    }
    const lines = [
      (S.opts && S.opts.wild===false ? '' : '야생 ') + enemyName + ' 쓰러뜨림!',
      '경험치 +' + xpGain
    ];
    if(levelUps.length > 0) lines.push('레벨업! Lv.' + S.romi.lv + ' !');
    lines.push('');
    lines.push('(탭하여 계속)');
    finalize('win', { lines, xpGain, levelUps });
  }

  function defeat(){
    const lines = [
      S.enemy.name + '에게 졌다...',
      '',
      '정신을 차려보니',
      '마을로 돌아와 있었다.',
      '(HP 전체 회복)'
    ];
    // 전체 회복
    S.romi.hp = S.romi.maxHp;
    if(window.STATE && window.STATE.romi){ window.STATE.romi.hp = window.STATE.romi.maxHp || S.romi.maxHp; }
    finalize('lose', { lines });
  }

  function finalize(kind, extra){
    S.result = Object.assign({ kind }, extra||{});
    S.mode = 'result';
    if(window.STATE) window.STATE.battleResult = S.result;
  }

  function closeResult(){
    const r = S.result;
    S.active = false;
    if(window.STATE) window.STATE.battle = null;
    if(r && r.kind === 'win'){
      if(typeof S.onVictory === 'function') try{ S.onVictory(r); }catch(e){ console.error(e); }
    } else {
      if(typeof S.onDefeat === 'function') try{ S.onDefeat(r); }catch(e){ console.error(e); }
    }
  }

  function onEnter(opts){
    // Dispatcher 용 훅 — opts로 start 호출 가능
    if(opts && opts.enemy){
      const romi = opts.romi || (window.makeRomi ? window.makeRomi() : null);
      start(romi, opts.enemy, opts);
    }
  }
  function onExit(){
    // 필요 시 정리
  }

  window.V3Battle = {
    start, update, render, handleInput,
    onEnter, onExit,
    _state: S   // 디버그용
  };

  console.log('[UNIFIED] V3Battle 엔진 로드 완료 (로미 중심)');
})();
