"""Import the supplied v7 verbatim, then derive its service shell (no reconstruction)."""
from pathlib import Path
import hashlib
import json
import re
import sys

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]).read_bytes()
reference = root / 'reference' / 'moa_diary_v7.html'
reference.parent.mkdir(exist_ok=True)
reference.write_bytes(source)
(reference.parent / 'provenance.json').write_text(json.dumps({
    'source': 'user attachment moa_diary_v7.html', 'bytes': len(source),
    'sha256': hashlib.sha256(source).hexdigest(),
    'derivation': 'index.html retains v7 CSS and section markup; runtime replaced with modular authenticated storage'
}, ensure_ascii=False, indent=2), encoding='utf-8')
s = source.decode('utf-8')
s = s[:s.index('<script>')] + '<script type="module" src="./app.js"></script></body></html>\n'
s = re.sub(r' on(?:click|change)="[^"]*"', '', s)
s = s.replace('<span class="pill">🔒 기기 저장 · 계정 미연결</span>', '<button class="pill secondary" id="accountBtn">로그인 · 계정</button>')
s = s.replace('<button>+ 오늘 기록하기</button>', '<button id="writeNow">+ 오늘 기록하기</button>')
s = s.replace('class="secondary">추가</button>', 'class="secondary" id="addHabit">추가</button>')
s = s.replace('<button class="secondary">백업 복원</button>', '<button class="secondary" id="restoreBtn">백업 복원</button>')
s = s.replace('<select id="visibility" style="flex:1"><option value="private">비공개</option><option value="public">공개 후보 (시제품에서는 외부 공개 안 됨)</option></select>', '<span class="tag">🔒 나만 보기</span>')
s = re.sub(r'<div id="privacyNotice">.*?</div>', '<div id="privacyNotice" role="status">저장소를 불러오는 중…</div>', s)
s = s.replace('사진·영상 첨부 (이 브라우저의 기기 저장소에 보관 · 기기별 용량 제한)', '사진·영상 첨부 · 최대 6개, 파일당 25MB')
s = s.replace('accept="image/*,video/*"', 'accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"')
s = s.replace('로그인·서버 저장·외부 공개 기능은 아직 없습니다. 전체 백업에 사진과 영상이 포함되지만 대용량 파일은 제한될 수 있어요.', '기록과 미디어는 나만 볼 수 있어요. 계정 로그인 시 클라우드에 저장됩니다.')
s = s.replace('모아 · 로컬 체험판 · 기기 삭제 및 저장 공간 부족에 대비해 정기적으로 전체 백업해 주세요', '모아 · 소중한 하루를 모으는 곳 · <span id="buildId"></span>')
s = s.replace('<input id="title"', '<label for="title">제목</label><input id="title"')
s = s.replace('<textarea id="content"', '<label for="content">오늘의 이야기</label><textarea maxlength="20000" id="content"')
s = s.replace('<input id="habitName"', '<label class="sr-only" for="habitName">새 습관 이름</label><input maxlength="80" id="habitName"')
s = s.replace('<select id="category"', '<select aria-label="기록 분류" id="category"')
s = s.replace('<select id="filter"', '<select aria-label="분류별 보기" id="filter"')
s = s.replace('id="prevMonth"', 'aria-label="이전 달" id="prevMonth"').replace('id="nextMonth"', 'aria-label="다음 달" id="nextMonth"')
s = s.replace('<input accept="image/', '<input aria-label="사진·영상 선택" accept="image/')
s = s.replace('</head>', '<meta name="referrer" content="no-referrer"><meta name="color-scheme" content="light"><link rel="stylesheet" href="./service.css"></head>')
s = s.replace('<body>', '''<body><div id="notice" role="status" aria-live="polite" hidden></div>
<dialog id="accountDialog" aria-labelledby="accountTitle"><h2 id="accountTitle">나의 모아</h2><p id="accountStatus"></p>
<form id="loginForm"><label for="email">이메일</label><input id="email" type="email" autocomplete="username" required>
<label for="password">비밀번호</label><input id="password" type="password" autocomplete="current-password" minlength="12" required>
<div class="row"><button type="submit">로그인</button><button type="button" class="secondary" id="signupBtn">회원가입</button></div></form>
<p class="muted" id="authHint">회원가입 후 받은 인증 링크를 복사해 아래에서 확인해 주세요.</p>
<form id="confirmEmailForm"><label for="confirmEmailLink">이메일 인증 링크</label><input id="confirmEmailLink" type="url" autocomplete="off" required><button type="submit" class="secondary">인증하고 로그인</button></form><button id="logoutBtn" hidden>로그아웃</button>
<hr><p class="muted">이 기기의 기록은 로그인해도 자동 전송되지 않아요. 전체 백업 후 계정에서 복원해 옮길 수 있어요.</p>
<button id="legacyBtn" class="secondary">이 기기의 v7 기록 가져오기</button><button id="closeAccount" class="secondary">닫기</button></dialog>
<dialog id="backupDialog" aria-labelledby="backupTitle"><form id="backupForm"><h2 id="backupTitle">암호화 백업</h2>
<p id="backupHint">백업 암호를 안전하게 보관해 주세요. 암호를 잊으면 복원할 수 없어요.</p><label for="backupPassword">백업 암호 (12자 이상)</label>
<input id="backupPassword" type="password" autocomplete="off" minlength="12"><div class="row"><button type="submit">계속</button><button type="button" id="cancelBackup" class="secondary">취소</button></div></form></dialog>''')
s = s.replace('<p class="muted">누적 기록 수</p>', '<p class="muted">누적 기록 수</p><p class="muted" id="storageUsage">첨부 사용량 확인 중…</p><button type="button" id="cleanupMedia" class="secondary">하루 지난 미사용 첨부 정리</button>')
s = s.replace('<button id="logoutBtn"', '<button id="forgotPassword" class="secondary" type="button">비밀번호 찾기</button><button id="withdrawBtn" class="secondary" type="button" hidden>모아 탈퇴 · 기록 전체 삭제</button><button id="rejoinBtn" class="secondary" type="button" hidden>모아 다시 시작</button><button id="clearDeviceBtn" class="secondary" type="button">현재 기기 모드 기록 삭제</button><button id="logoutBtn"')
s = s.replace('<dialog id="backupDialog"', (root / 'ui/lifecycle.html').read_text(encoding='utf-8') + '<dialog id="backupDialog"')
s = s.replace('<h2>새로운 순간 남기기</h2>', '<h2>새로운 순간 남기기</h2><p class="muted">첨부 합계 48MiB까지 저장할 수 있어요. 사진은 선택해서 용량을 줄이고, 큰 영상은 기기에서 짧게 편집해 주세요.</p>')
s = s.replace('<form id="entryForm">', '<form id="entryForm"><label class="optimize-toggle"><input type="checkbox" id="optimizePhotos"> 사진을 최대 1920px로 줄여 저장 (원본은 기기에 유지)</label><p class="muted" id="uploadEstimate" aria-live="polite"></p>')
s = s.replace('<p class="muted" id="storageUsage">', '<progress id="storageBar" max="50331648" value="0" aria-label="미디어 저장 용량"></progress><p class="muted" id="backupStatus"></p><button id="diagnosticBtn" type="button" class="secondary">연결 점검 · 진단 받기</button><p class="muted" id="storageUsage">')
s = s.replace('<body>', '<body><p id="connectionNotice" role="status" hidden>연결이 끊겼어요. 클라우드 저장과 미디어 불러오기를 확인해 주세요.</p>')
s = '\n'.join(line.rstrip() for line in s.splitlines()) + '\n'
(root / 'index.html').write_text(s, encoding='utf-8', newline='\n')
print('Imported original:', len(source), hashlib.sha256(source).hexdigest())
