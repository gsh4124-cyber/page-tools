(() => {
  const copyText = window.BibleClipboard?.copyText;
  if (!copyText) return;

  for (const passage of document.querySelectorAll('.topic-passage')) {
    const reference = passage.querySelector('h2')?.textContent.trim();
    const links = passage.querySelector('.passage-links');
    const verses = Array.from(passage.querySelectorAll('blockquote p'), line => {
      const number = line.querySelector('sup')?.textContent.trim();
      const verse = line.querySelector('.topic-verse')?.textContent.trim();
      return number && verse ? number + ' ' + verse : '';
    }).filter(Boolean);
    if (!reference || !links || !verses.length) continue;

    const action = document.createElement('li');
    action.className = 'topic-copy-action';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'topic-copy-button';
    button.textContent = '구절 복사';
    button.setAttribute('aria-label', reference + ' 구절 복사');
    const status = document.createElement('span');
    status.className = 'topic-copy-status';
    status.setAttribute('role', 'status');
    action.append(button, status);
    links.append(action);

    const text = reference + ' (개역한글)\n\n' + verses.join('\n');
    button.addEventListener('click', async () => {
      status.textContent = '';
      const copied = await copyText(text);
      status.textContent = copied ? '복사했어요' : '복사하지 못했어요. 다시 시도해 주세요.';
    });
  }
})();
