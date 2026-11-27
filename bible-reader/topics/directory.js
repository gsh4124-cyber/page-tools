const phoneLayout = window.matchMedia('(max-width: 540px)');
const groupLinks = document.querySelectorAll('.directory-jump a');
const groups = Array.from(groupLinks, (link) => ({
  link,
  section: document.getElementById(link.hash.slice(1)).closest('.directory-group'),
}));

function showCurrentGroup() {
  const currentGroup = groups.find(({ link }) => link.hash === window.location.hash) ?? groups[0];
  document.body.toggleAttribute('data-topic-picker', phoneLayout.matches);

  for (const group of groups) {
    const isCurrent = phoneLayout.matches && group === currentGroup;
    group.section.toggleAttribute('data-current', isCurrent);
    if (isCurrent) {
      group.link.setAttribute('aria-current', 'location');
    } else {
      group.link.removeAttribute('aria-current');
    }
  }
}

for (const { link } of groups) {
  link.addEventListener('click', (event) => {
    if (!phoneLayout.matches || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

    event.preventDefault();
    if (window.location.hash !== link.hash) window.history.pushState(null, '', link.hash);
    showCurrentGroup();
  });
}

phoneLayout.addEventListener('change', showCurrentGroup);
window.addEventListener('hashchange', showCurrentGroup);
showCurrentGroup();
