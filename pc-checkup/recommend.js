// Korean-only repair tips and replacement picks (Coupang Partners).
// Shown on the full checkup only for items marked "문제", and collapsed at the
// bottom of individual test pages. Links stay disabled until a real affiliate
// URL is filled in, so no plain (non-attributed) shopping links are published.
(() => {
  'use strict';
  if ((document.documentElement.lang || '').slice(0, 2) !== 'ko') return;
  const DISCLOSURE = '이 추천에는 쿠팡 파트너스 링크가 포함돼 있으며, 구매 시 이에 따른 일정액의 수수료를 제공받습니다. 가격·배송 조건은 판매처에서 최신 정보를 확인하세요.';
  const DATA = {
    keyboard: {
      label: '키보드',
      fixes: ['다른 USB 포트에 꽂아 보세요. 허브를 쓰고 있다면 본체에 바로 연결해 보세요.', '무선이라면 배터리를 새것으로 바꾸고 수신기를 다시 꽂아 보세요.', '키 사이 먼지를 털어내거나 에어 스프레이로 불어 보세요.', '다른 컴퓨터에 연결해도 같은 키가 안 되면 키보드 문제일 가능성이 높아요.'],
      picks: [
        {tag: '가성비', name: '유선 기본 키보드', note: '사무·학습용', url: null},
        {tag: '무선', name: '무선 키보드·마우스 세트', note: '선 정리가 편해요', url: null},
        {tag: '타자·게임', name: '기계식 키보드', note: '내구성이 좋아요', url: null}]
    },
    mouse: {
      label: '마우스',
      fixes: ['다른 USB 포트에 꽂아 보세요.', '무선이라면 배터리를 바꾸고 수신기를 마우스 가까이 두세요.', '유리나 반짝이는 책상에서는 센서가 잘 안 읽혀요. 마우스 패드를 깔아 보세요.', '휠이나 클릭이 가끔 두 번 눌리면 스위치 노후일 수 있어요.'],
      picks: [
        {tag: '가성비', name: '유선 기본 마우스', note: '고장 걱정이 적어요', url: null},
        {tag: '조용함', name: '무선 저소음 마우스', note: '사무실·도서관용', url: null},
        {tag: '손목', name: '버티컬 마우스', note: '손목 부담을 줄여요', url: null}]
    },
    mic: {
      label: '마이크',
      fixes: ['브라우저 주소창 왼쪽 자물쇠에서 마이크 권한이 허용돼 있는지 확인하세요.', 'Windows 설정 → 개인 정보 → 마이크에서 앱 접근이 켜져 있는지 확인하세요.', '이어폰 마이크라면 단자를 끝까지 꽂고, 4극 단자를 지원하는지 확인하세요.', '소리 설정에서 입력 장치가 올바른 마이크로 선택돼 있는지 확인하세요.'],
      picks: [
        {tag: '화상회의', name: 'USB 마이크', note: '꽂으면 바로 인식', url: null},
        {tag: '강의·녹음', name: '클립형 핀 마이크', note: '옷깃에 달아요', url: null},
        {tag: '통화', name: '마이크 달린 헤드셋', note: '소리와 마이크를 한 번에', url: null}]
    },
    webcam: {
      label: '웹캠',
      fixes: ['브라우저 카메라 권한이 허용돼 있는지 확인하세요.', '노트북에 카메라 가림막이나 단축키(F키) 끄기 기능이 있는지 확인하세요.', '줌·팀즈처럼 카메라를 쓰는 다른 프로그램을 모두 닫고 다시 시도하세요.', '외장 웹캠은 다른 USB 포트에 꽂아 보세요.'],
      picks: [
        {tag: '기본', name: 'FHD 1080p 웹캠', note: '화상회의에 충분해요', url: null},
        {tag: '선명함', name: 'QHD 2K 웹캠', note: '방송·강의용', url: null},
        {tag: '조명', name: '모니터 링라이트', note: '어두운 방에서 얼굴을 밝게', url: null}]
    },
    speaker: {
      label: '스피커',
      fixes: ['볼륨과 음소거 상태를 먼저 확인하세요. 작업 표시줄 스피커 아이콘을 눌러 보세요.', '소리 설정에서 출력 장치가 올바르게 선택돼 있는지 확인하세요.', '이어폰은 단자를 끝까지 꽂고, 블루투스는 연결을 끊었다가 다시 연결해 보세요.', '한쪽만 안 들리면 소리 설정의 좌우 균형(밸런스)을 확인하세요.'],
      picks: [
        {tag: '책상용', name: 'USB PC 스피커', note: '전원 어댑터 없이', url: null},
        {tag: '가성비', name: '유선 이어폰', note: '지연 없이 바로', url: null},
        {tag: '무선', name: '블루투스 스피커', note: '휴대폰과 함께', url: null}]
    }
  };
  const PAGE = {'keyboard': 'keyboard', 'mouse': 'mouse', 'mic': 'mic', 'webcam': 'webcam', 'speaker': 'speaker'};

  const css = `.rec-wrap{margin:18px 0 0}.rec-card{background:var(--panel,#121923);border:1px solid var(--line,#273445);border-radius:16px;padding:16px 18px;margin-top:12px}
.rec-card h3{margin:0 0 8px;font-size:16px}.rec-card ol{margin:0;padding-left:20px;color:var(--muted,#9aa8b8);font-size:14px;line-height:1.7}
.rec-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-top:10px}
.rec-item{display:flex;flex-direction:column;gap:2px;background:var(--panel-2,#182230);border:1px solid var(--line,#273445);border-radius:12px;padding:12px}
.rec-item small{color:var(--accent,#6ee7b7);font-size:11.5px;font-weight:800}.rec-item b{font-size:14px}.rec-item span{color:var(--muted,#9aa8b8);font-size:12.5px}
.rec-item a,.rec-item em{margin-top:10px;display:block;text-align:center;padding:9px;border-radius:9px;font-size:13px;font-weight:800;font-style:normal;text-decoration:none}
.rec-item a{background:var(--accent,#6ee7b7);color:#062217}.rec-item em{background:transparent;border:1px dashed var(--line,#273445);color:var(--muted,#9aa8b8)}
.rec-note{margin:10px 0 0;font-size:11.5px;color:var(--muted,#9aa8b8);line-height:1.6}
details.rec-details{margin-top:18px;background:var(--panel,#121923);border:1px solid var(--line,#273445);border-radius:16px;padding:4px 18px}
details.rec-details>summary{cursor:pointer;padding:12px 0;font-weight:800;list-style:none}details.rec-details>summary::-webkit-details-marker{display:none}
details.rec-details>summary::after{content:" ▾";color:var(--muted,#9aa8b8)}details.rec-details[open]>summary::after{content:" ▴"}
details.rec-details .rec-card{background:transparent;border:0;padding:0 0 14px;margin:0}`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);

  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]);
  function block(id, withTitle) {
    const d = DATA[id];
    const picks = d.picks.map(p => `<div class="rec-item"><small>${esc(p.tag)}</small><b>${esc(p.name)}</b><span>${esc(p.note)}</span>${p.url
      ? `<a href="${esc(p.url)}" target="_blank" rel="sponsored noopener" referrerpolicy="unsafe-url">쿠팡에서 보기</a>`
      : '<em>링크 준비 중</em>'}</div>`).join('');
    return `<div class="rec-card" data-rec="${id}">${withTitle ? `<h3>${esc(d.label)}: 먼저 이렇게 해 보세요</h3>` : '<h3>먼저 이렇게 해 보세요</h3>'}
      <ol>${d.fixes.map(f => `<li>${esc(f)}</li>`).join('')}</ol>
      <h3 style="margin-top:16px">그래도 안 되면, 교체용 ${esc(d.label)}</h3><div class="rec-grid">${picks}</div>
      <p class="rec-note">${DISCLOSURE}</p></div>`;
  }

  const page = location.pathname.split('/').pop().replace(/\.html$/, '') || 'index';
  if (PAGE[page]) {
    const host = document.querySelector('section.toolbox');
    if (!host) return;
    const det = document.createElement('details');
    det.className = 'rec-details';
    det.innerHTML = `<summary>${esc(DATA[page].label)}에 문제가 있나요? 해결 방법과 교체용 제품 보기</summary>${block(page, false)}`;
    host.after(det);
    return;
  }
  if (page === 'checkup') {
    const list = document.getElementById('checklist');
    if (!list) return;
    const wrap = document.createElement('div');
    wrap.className = 'rec-wrap';
    wrap.setAttribute('aria-live', 'polite');
    list.after(wrap);
    const read = () => { try { return JSON.parse(localStorage.getItem('pc-checkup-results-v1') || '{}') || {}; } catch (e) { return {}; } };
    const render = () => {
      const state = read();
      const bad = Object.keys(DATA).filter(id => state[id] === 'bad');
      wrap.innerHTML = bad.map(id => block(id, true)).join('');
    };
    document.addEventListener('click', e => { if (e.target.closest('.pill')) setTimeout(render, 0); });
    render();
  }
})();
