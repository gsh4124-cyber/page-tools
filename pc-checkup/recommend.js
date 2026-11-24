// Korean-only repair tips and replacement picks (Coupang Partners).
// Shown on the full checkup only for items marked "문제", and collapsed at the
// bottom of individual test pages. Links stay disabled until a real affiliate
// URL is filled in, so no plain (non-attributed) shopping links are published.
(() => {
  'use strict';
  if ((document.documentElement.lang || '').slice(0, 2) !== 'ko') return;
  const DISCLOSURE = '이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다. 가격·배송 조건은 판매처에서 최신 정보를 확인하세요.';
  const DATA = {
    keyboard: {
      label: '키보드',
      fixes: ['다른 USB 포트에 꽂아 보세요. 허브를 쓰고 있다면 본체에 바로 연결해 보세요.', '무선이라면 배터리를 새것으로 바꾸고 수신기를 다시 꽂아 보세요.', '키 사이 먼지를 털어내거나 에어 스프레이로 불어 보세요.', '다른 컴퓨터에 연결해도 같은 키가 안 되면 키보드 문제일 가능성이 높아요.'],
      picks: [
        {tag: '가성비', name: '로지텍 유선 키보드 K120', note: '사무·학습용 기본형', url: 'https://link.coupang.com/a/iVBE2FiWnQ'},
        {tag: '무선', name: '로지텍 무선 키보드·마우스 MK275', note: '선 정리가 편해요', url: 'https://link.coupang.com/a/iVBHtbd3hA'},
        {tag: '타자·게임', name: '한성 기계식 키보드 GK204 적축', note: '부드러운 타건감', url: 'https://link.coupang.com/a/iVBLeAlyTY'}]
    },
    mouse: {
      label: '마우스',
      fixes: ['다른 USB 포트에 꽂아 보세요.', '무선이라면 배터리를 바꾸고 수신기를 마우스 가까이 두세요.', '유리나 반짝이는 책상에서는 센서가 잘 안 읽혀요. 마우스 패드를 깔아 보세요.', '휠이나 클릭이 가끔 두 번 눌리면 스위치 노후일 수 있어요.'],
      picks: [
        {tag: '가성비', name: '로지텍 유선 마우스 M100R', note: '고장 걱정이 적어요', url: 'https://link.coupang.com/a/iVBLN1mPFk'},
        {tag: '조용함', name: '로지텍 무소음 무선 마우스 M331', note: '사무실·도서관용', url: 'https://link.coupang.com/a/iVBMn9mpie'},
        {tag: '손목', name: '로지텍 리프트 버티컬 마우스', note: '손목 부담을 줄여요', url: 'https://link.coupang.com/a/iVBMXAgNPM'}]
    },
    mic: {
      label: '마이크',
      fixes: ['브라우저 주소창 왼쪽 자물쇠에서 마이크 권한이 허용돼 있는지 확인하세요.', 'Windows 설정 → 개인 정보 → 마이크에서 앱 접근이 켜져 있는지 확인하세요.', '이어폰 마이크라면 단자를 끝까지 꽂고, 4극 단자를 지원하는지 확인하세요.', '소리 설정에서 입력 장치가 올바른 마이크로 선택돼 있는지 확인하세요.'],
      picks: [
        {tag: '화상회의', name: '필라 USB 콘덴서 마이크 CM-700USB', note: '꽂으면 바로 인식', url: 'https://link.coupang.com/a/iVBSnN6XSu'},
        {tag: '강의·녹음', name: '조이트론 USB 핀마이크 P5U', note: '옷깃에 달아요', url: 'https://link.coupang.com/a/iVBSXSTuea'},
        {tag: '통화', name: '앱코 노이즈캔슬링 헤드셋 H58', note: '소리와 마이크를 한 번에', url: 'https://link.coupang.com/a/iVBTxvyjka'}]
    },
    webcam: {
      label: '웹캠',
      fixes: ['브라우저 카메라 권한이 허용돼 있는지 확인하세요.', '노트북에 카메라 가림막이나 단축키(F키) 끄기 기능이 있는지 확인하세요.', '줌·팀즈처럼 카메라를 쓰는 다른 프로그램을 모두 닫고 다시 시도하세요.', '외장 웹캠은 다른 USB 포트에 꽂아 보세요.'],
      picks: [
        {tag: '기본', name: '로지텍 BRIO 100 웹캠', note: 'FHD 화상회의용', url: 'https://link.coupang.com/a/iVBT775GMe'},
        {tag: '선명함', name: '홈플래닛 QHD 웹캠 LX-V11', note: '오토포커스·마이크 내장', url: 'https://link.coupang.com/a/iVBUGiLFDM'},
        {tag: '조명', name: '모니터 거치형 6인치 링라이트', note: '어두운 방에서 얼굴을 밝게', url: 'https://link.coupang.com/a/iVBVY8RPyK'}]
    },
    speaker: {
      label: '스피커',
      fixes: ['볼륨과 음소거 상태를 먼저 확인하세요. 작업 표시줄 스피커 아이콘을 눌러 보세요.', '소리 설정에서 출력 장치가 올바르게 선택돼 있는지 확인하세요.', '이어폰은 단자를 끝까지 꽂고, 블루투스는 연결을 끊었다가 다시 연결해 보세요.', '한쪽만 안 들리면 소리 설정의 좌우 균형(밸런스)을 확인하세요.'],
      picks: [
        {tag: '책상용', name: '브리츠 USB 사운드바 BA-R9', note: 'USB 전원으로 간단하게', url: 'https://link.coupang.com/a/iVBWynXWRo'},
        {tag: '가성비', name: '아이리버 3.5mm 유선 이어폰', note: '지연 없이 바로', url: 'https://link.coupang.com/a/iVBW7MGr2O'},
        {tag: '무선', name: '오아 아이브릭 블루투스 스피커', note: '휴대폰과 함께', url: 'https://link.coupang.com/a/iVBXGZf9Ii'}]
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
    const read = () => { try { return JSON.parse(window.DeviceStorage.getItem('pc-checkup-results-v1') || '{}') || {}; } catch (e) { return {}; } };
    const render = () => {
      const state = read();
      const bad = Object.keys(DATA).filter(id => state[id] === 'bad');
      wrap.innerHTML = bad.map(id => block(id, true)).join('');
    };
    document.addEventListener('click', e => { if (e.target.closest('.pill')) setTimeout(render, 0); });
    render();
  }
})();
