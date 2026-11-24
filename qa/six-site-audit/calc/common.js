// 공통: 헤더/푸터, 계산기 목록, 숫자 포맷, 콤마 입력
const SITE = "계산<span>모아</span>";
// [파일, 이름, 설명, 분류, 기호, 새로 추가 여부]
const CALCS = [
  ["yearend.html", "연말정산 계산기", "2025년 귀속 환급금 미리 계산", "money", "환급"],
  ["salary.html", "연봉 실수령액 계산기", "2026년 4대보험·소득세 반영", "money", "₩"],
  ["hourly.html", "시급·주휴수당 계산기", "2026 최저시급 10,320원", "money", "시급"],
  ["unemployment.html", "실업급여 계산기", "하루 금액·받는 기간·총액", "money", "실업", 1],
  ["parental.html", "육아휴직 급여 계산기", "2026년 달마다 받는 금액", "money", "육휴", 1],
  ["cartax.html", "자동차세 계산기", "1월 연납 할인·차령 경감", "money", "차세", 1],
  ["severance.html", "퇴직금 계산기", "평균임금 기준 법정 퇴직금", "money", "퇴직"],
  ["loan.html", "대출이자 계산기", "원리금균등·원금균등·만기일시", "money", "대출"],
  ["savings.html", "적금·예금 이자 계산기", "단리/복리, 세후 수령액", "money", "이자"],
  ["vat.html", "부가세 계산기", "공급가액 ↔ 합계금액", "money", "VAT"],
  ["broker.html", "중개수수료 계산기", "매매·전세·월세 중개보수", "home", "중개"],
  ["rent.html", "전월세 전환 계산기", "보증금 ↔ 월세 환산", "home", "전월"],
  ["area.html", "평수 계산기", "㎡ ↔ 평 변환", "home", "㎡"],
  ["holidays-2027.html", "2027년 공휴일 달력", "대체공휴일 7일·연차 꿀팁", "date", "휴일"],
  ["discharge.html", "전역일 계산기", "육군·해군·공군·사회복무 D-day", "date", "전역", 1],
  ["dday.html", "날짜·D-day 계산기", "며칠 남았는지, 며칠 후", "date", "D"],
  ["age.html", "만나이 계산기", "만나이·연나이·띠·D-day", "date", "나이"],
  ["leave.html", "연차 계산기", "입사일 기준 연차 일수", "date", "연차"],
  ["percent.html", "퍼센트 계산기", "비율·증감률·%p 계산", "life", "%"],
  ["discount.html", "할인율 계산기", "할인 가격·할인율 역산", "life", "할인"],
  ["electric.html", "전기요금 계산기", "주택용 누진제·여름철 요금", "life", "kWh", 1],
  ["bmi.html", "BMI 계산기", "체질량지수·비만도", "life", "BMI"],
  ["charcount.html", "글자수 세기", "공백 포함·제외, 바이트", "life", "가A"],
];
const GROUPS = [["money", "돈·세금"], ["home", "집·부동산"], ["date", "날짜·근무"], ["life", "생활"]];

function tileHTML(c) {
  return `<a class="tile${c[5] ? " new" : ""}" href="${c[0]}" data-q="${(c[1] + c[2]).toLowerCase()}"><span class="sym">${c[4]}</span><span><b>${c[1]}</b><small>${c[2]}</small></span></a>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const here = location.pathname.split("/").pop() || "index.html";
  const h = document.querySelector("header");
  if (h) h.innerHTML = `<div class="wrap top"><a class="logo" href="./">${SITE}</a>
    <nav aria-label="자주 쓰는 계산기">${CALCS.slice(0, 5).map(c => `<a href="${c[0]}"${c[0] === here ? ' aria-current="page" style="color:var(--ink)"' : ""}>${c[1].replace(" 계산기", "")}</a>`).join("")}</nav></div>`;
  const f = document.querySelector("footer");
  if (f) f.innerHTML = `<a href="about.html">서비스 소개</a> · <a href="privacy.html">개인정보처리방침</a> · <a href="contact.html">문의</a><br>계산 결과는 참고용이며 실제 금액은 금융기관·법령 기준에 따라 달라질 수 있습니다.<br>© ${new Date().getFullYear()} 계산모아`;
  const more = document.querySelector("#more");
  if (more) {
    const me = CALCS.find(c => c[0] === here);
    const same = CALCS.filter(c => c[0] !== here && me && c[3] === me[3]);
    const rest = CALCS.filter(c => c[0] !== here && !same.includes(c));
    more.innerHTML = `<h2 style="margin:0 0 12px">다른 계산기</h2><div class="grid">${[...same, ...rest].slice(0, 8).map(tileHTML).join("")}</div>
      <p style="margin:12px 0 0;font-size:14px"><a href="./">계산기 ${CALCS.length}개 전체 보기 →</a></p>`;
  }
  // 금액 입력칸 콤마 자동
  document.querySelectorAll("input.money").forEach(el => {
    el.setAttribute("inputmode", "numeric");
    el.addEventListener("input", () => {
      const v = el.value.replace(/[^0-9]/g, "");
      el.value = v ? Number(v).toLocaleString("ko-KR") : "";
    });
  });
});

const num = id => {
  const el = document.getElementById(id);
  return Number(String(el.value).replace(/,/g, "")) || 0;
};
const won = n => Math.round(n).toLocaleString("ko-KR") + "원";
const kv = (k, v) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`;
function show(id, html) {
  const r = document.getElementById(id);
  r.innerHTML = html;
  r.dataset.state = "ready"; r.setAttribute("role", "status");
  r.classList.add("show");
  if (!window.QUIET && r.getBoundingClientRect().top > innerHeight - 120) r.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Never leave an old answer visible after an invalid or cleared input.
document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.calc !== "function") return;
  const calculate=window.calc;
  window.calc=function(...args){
    const out=document.getElementById("out");
    const status=message=>{if(!out)return;const p=document.createElement("p");p.textContent=message;out.replaceChildren(p);out.dataset.state="invalid";out.setAttribute("role","status");out.classList.add("show");};
    const fields=[...document.querySelectorAll("main input")].filter(el=>el.getClientRects().length&&!['checkbox','radio','button','submit'].includes(el.type));
    for(const field of fields){
      const raw=String(field.value).replace(/,/g,"").trim(),numeric=field.type==='number'||field.classList.contains('money');
      if((field.validity?.badInput)||(raw&&numeric&&(!Number.isFinite(Number(raw))||Math.abs(Number(raw))>Number.MAX_SAFE_INTEGER))||(raw&&typeof field.checkValidity==='function'&&!field.checkValidity())){status("입력 범위를 확인해 주세요.");return;}
    }
    if(out){out.replaceChildren();out.dataset.state="pending";}
    const previousAlert=window.alert;let message='';window.alert=text=>{message=String(text);};
    try{const result=calculate.apply(this,args);if(message)status(message);else if(out&&!out.innerHTML.trim())status("계산할 값을 입력해 주세요.");else if(out&&/NaN|Infinity|∞|undefined/.test(out.textContent))status("계산할 수 있는 범위의 값을 입력해 주세요.");return result;}
    catch{status("입력값을 확인한 뒤 다시 계산해 주세요.");}
    finally{window.alert=previousAlert;}
  };
});

// 쉬운 입력: 선택 버튼(chips)과 입력하면 바로 계산
const chip = id => { const b = document.querySelector("#" + id + " [aria-pressed=true]"); return b ? b.dataset.v : null; };
document.addEventListener("click", e => {
  const b = e.target.closest(".chips button"); if (!b) return;
  b.parentElement.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b));
  if (document.body.dataset.live && window.calc) { const a = window.alert; window.alert = () => {}; window.QUIET = true; try { calc(); } catch (e) {} window.QUIET = false; window.alert = a; }
});
document.addEventListener("DOMContentLoaded", () => {
  if (!document.body.dataset.live || !window.calc) return;
  document.querySelectorAll("main select").forEach(sel => {
    if (sel.options.length > 5) return;
    const box = document.createElement("div"); box.className = "chips"; box.id = sel.id + "-chips";
    [...sel.options].forEach(o => { const b = document.createElement("button"); b.type = "button"; b.dataset.v = o.value; b.textContent = o.textContent;
      b.setAttribute("aria-pressed", o.value === sel.value);
      b.addEventListener("click", () => { sel.value = o.value; sel.dispatchEvent(new Event("change")); }); box.append(b); });
    sel.hidden = true; sel.after(box);
  });
  const run = () => { const a = window.alert; window.alert = () => {}; window.QUIET = true; try { calc(); } catch (e) {} window.QUIET = false; window.alert = a; };
  document.querySelectorAll("main select").forEach(el => el.addEventListener("change", run));
  document.querySelectorAll("main input, main select").forEach(el => el.addEventListener("input", run));
  setTimeout(run, 0);
});
