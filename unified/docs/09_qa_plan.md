# 09. QA 계획

> 이 문서의 목적: UNIFIED v4의 골든패스 자동 테스트, 회귀 테스트, 성능/호환 기준, 배포 체크리스트를 정의한다.

---

## 1. 골든패스 Puppeteer 테스트 (Act별 스켈레톤)

각 Act의 핵심 전환이 정상 작동하는지 검증. 실패 시 스크린샷 저장.

### 1-1. 공통 setup

```javascript
// unified/qa/_setup.js
const puppeteer = require('puppeteer');

async function launchGame() {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 420, height: 750, isMobile: true }
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:8080/hatcuping-unified.html');
  await page.waitForFunction(() => window.STATE && window.STATE.ready);
  return { browser, page };
}

async function shot(page, name) {
  await page.screenshot({ path: `unified/qa/_shots/${name}.png` });
}

module.exports = { launchGame, shot };
```

### 1-2. Act1 테스트

```javascript
// unified/qa/test_act1.js
const { launchGame, shot } = require('./_setup');

(async () => {
  const { browser, page } = await launchGame();
  await shot(page, 'act1_start');

  // 엄마 NPC 클릭
  await page.evaluate(() => window.STATE.triggerDialog('mom_wake'));
  await page.waitForFunction(() => window.STATE.mode === 'dodge'); // Act1.5 진입
  await shot(page, 'act1_end_to_act15');

  console.log('Act1 OK');
  await browser.close();
})();
```

### 1-3. Act1.5 테스트 (눈피하기)

```javascript
// unified/qa/test_act15.js
(async () => {
  const { browser, page } = await launchGame();
  await page.evaluate(() => window.STATE.jumpToAct('1.5'));

  // 60초 생존 시뮬레이션 (가속)
  await page.evaluate(() => window.STATE.debugFastForward(60000));
  await page.waitForFunction(() => window.STATE.mode === 'platformer');
  await shot(page, 'act15_complete');

  console.log('Act1.5 OK');
  await browser.close();
})();
```

### 1-4. Act2 테스트 (플랫포머 + 보스)

```javascript
// unified/qa/test_act2.js
(async () => {
  const { browser, page } = await launchGame();
  await page.evaluate(() => window.STATE.jumpToAct('2'));

  // 점프 입력 10회
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
  }
  await shot(page, 'act2_platformer');

  // 보스전 진입 강제
  await page.evaluate(() => window.STATE.triggerBoss('knight'));
  await page.waitForFunction(() => window.STATE.battle?.active);
  await shot(page, 'act2_boss');

  // 보스 격파
  await page.evaluate(() => window.STATE.debugKillBoss());
  await page.waitForFunction(() => window.STATE.mode === 'cutscene');
  await shot(page, 'act2_cutscene');

  console.log('Act2 OK');
  await browser.close();
})();
```

### 1-5. Act3~Act8 스켈레톤

동일 패턴으로 `test_act3.js` ~ `test_act8.js` 작성. 각각:
- `jumpToAct(n)`으로 시작점 점프
- 핵심 인터랙션 에뮬레이션
- 다음 Act로 전환 확인
- 시작/중간/종료 스크린샷 3장 저장

### 1-6. 전체 골든패스 러너

```javascript
// unified/qa/run_all.js
const acts = ['1','1.5','2','3','4','5','6','7','8'];
(async () => {
  for (const act of acts) {
    console.log(`=== Testing Act ${act} ===`);
    require(`./test_act${act.replace('.','')}.js`);
  }
})();
```

---

## 2. 회귀 테스트

기존 게임 파일들이 UNIFIED 작업 중 **변경되지 않았음**을 git으로 검증.

### 2-1. Git diff 체크

```bash
# 기존 파일 무변경 검증
git diff --name-only HEAD -- hatcuping-game.html hatcuping-rpg.html rpg-v3/ | wc -l
# 기대 결과: 0 (변경된 파일 없음)
```

자동화 스크립트 `unified/qa/regression_diff_check.sh`:
```bash
#!/bin/bash
PROTECTED=(
  "hatcuping-game.html"
  "hatcuping-rpg.html"
  "rpg-v3/"
  "rpg-v2/"
)
for path in "${PROTECTED[@]}"; do
  changed=$(git diff --name-only HEAD -- "$path" | wc -l)
  if [ "$changed" -ne 0 ]; then
    echo "REGRESSION: $path modified!"
    exit 1
  fi
done
echo "Regression check OK"
```

### 2-2. 기존 게임 스모크 테스트
UNIFIED 배포 후 기존 v2/v3 게임이 여전히 동작하는지:
- `hatcuping-game.html` 로드 → Start 버튼 클릭 → 1스테이지 진입
- `hatcuping-rpg.html` 로드 → 첫 맵 이동 → 첫 전투 진입

---

## 3. 모바일 스크린샷 (420×750)

각 Act **3장 이상** 캡처하여 `unified/qa/_shots/act{N}/`에 저장.

| Act | 필수 캡처 포인트 |
|---|---|
| 1 | 시작, 대화 중, 대화 종료 |
| 1.5 | 시작, 중간 (눈송이 표시), 클리어 |
| 2 | 플랫포머 이동, 보스 등장, 보스 격파 |
| 3 | 오버월드, 버스러닝, 꿈 컷신 |
| 4 | 마을 도착, 해핑 전투, 리암 합류 |
| 5 | 탐색 이동, 티니핑 캐치, 하츄핑 합류 |
| 6 | 탈출 시작, 낙하물 회피, 탈출 완료 |
| 7 | 페이즈1, 페이즈2, 합체기 |
| 8 | 엔딩 오프닝, 엔딩 중간, 크레딧 |

**총 최소 27장** (9 Act × 3).

---

## 4. 성능 기준

| 항목 | 기준 | 측정 방법 |
|---|---|---|
| 프레임레이트 | **60fps 유지** (최소 55fps) | `performance.now()` 기반 FPS 미터 |
| 메모리 | **<100MB** | Chrome DevTools Performance 탭 |
| 초기 로딩 | **<3초** (모바일 4G) | `window.performance.timing` |
| Act 전환 시간 | **<500ms** | `console.time('actTransition')` |
| 입력 지연 | **<50ms** | 터치→반응 측정 |

### 성능 측정 자동화

```javascript
// unified/qa/perf_monitor.js
async function measurePerf(page, actName) {
  const metrics = await page.metrics();
  console.log(`${actName}: JSHeap=${(metrics.JSHeapUsedSize/1048576).toFixed(1)}MB`);

  const fps = await page.evaluate(() => {
    return new Promise(resolve => {
      let frames = 0;
      const start = performance.now();
      const count = () => {
        frames++;
        if (performance.now() - start < 1000) requestAnimationFrame(count);
        else resolve(frames);
      };
      requestAnimationFrame(count);
    });
  });
  console.log(`${actName}: FPS=${fps}`);

  if (fps < 55) throw new Error(`FPS too low in ${actName}: ${fps}`);
  if (metrics.JSHeapUsedSize > 100 * 1048576) throw new Error(`Memory over 100MB in ${actName}`);
}
```

---

## 5. 브라우저 호환성

| 플랫폼 | 버전 | 필수/권장 |
|---|---|---|
| Chrome (Desktop) | 최신 & -2 | 필수 |
| Safari (iOS) | 16+ | 필수 |
| Chrome (Android) | 최신 | 필수 |
| Samsung Internet | 최신 | 권장 |
| Firefox (Desktop) | 최신 | 권장 |
| 모바일 WebView (Android) | API 33+ | 필수 (APK 빌드) |

### 호환성 이슈 체크리스트
- [ ] `AudioContext` 자동 재생 정책 (iOS는 터치 전 차단)
- [ ] `touchstart` vs `click` (iOS 지연)
- [ ] `localStorage` 용량 제한 (iOS 시크릿 모드)
- [ ] Canvas 해상도 (`devicePixelRatio` 처리)

---

## 6. 배포 체크리스트

### 6-1. LevelPlay 경로 확인
- [ ] `D:/AI/03_신사업/LevelPlay/games/hatcuping-unified/` 심볼릭 링크 또는 복사 경로 확인
- [ ] LevelPlay 앱에서 Unified 게임 카드 표시됨

### 6-2. ServiceWorker 캐시 bump
- [ ] `sw.js`의 `CACHE_VERSION` 상수 값 증가 (v4.0.1 → v4.0.2)
- [ ] 기존 캐시 무효화 확인 (브라우저 재접속 시 새 버전 로드)

### 6-3. GitHub Pages 반영
- [ ] `git push origin main` 후 5분 이내 Pages 배포 확인
- [ ] 배포 URL에서 Act1~8 스모크 테스트
- [ ] `?v=TIMESTAMP` 쿼리로 캐시 버스팅 테스트

### 6-4. APK 빌드 (선택)
- [ ] `build_rpg.py` 또는 `build_unified.py` 실행
- [ ] Cordova 빌드 성공
- [ ] 실기 Android 기기에서 설치 테스트

### 6-5. 최종 검증
- [ ] 스크린샷 27장 모두 캡처 완료
- [ ] 회귀 diff 체크 통과
- [ ] 성능 기준 통과
- [ ] 골든패스 자동 테스트 올 그린

---

## 7. 버그 리포트 템플릿

```markdown
### 버그 제목
### 발생 Act / 모드
### 재현 단계
1.
2.
3.
### 기대 결과
### 실제 결과
### 스크린샷/로그
### 환경 (브라우저/OS/해상도)
```
