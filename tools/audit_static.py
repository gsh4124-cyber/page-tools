from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, unquote
import collections
import json

ROOT=Path(__file__).resolve().parents[1]
HOSTS={'bible-reader-1iz.pages.dev':'bible-reader','random-ppobgi.pages.dev':'random-ppobgi','pc-checkup.pages.dev':'pc-checkup'}
class Scan(HTMLParser):
 def __init__(self):
  super().__init__();self.ids=[];self.refs=[];self.base=None
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs)
  if attrs.get('id'):self.ids.append(attrs['id'])
  if tag=='base':self.base=attrs.get('href')
  if tag in ('a','link') and attrs.get('href'):self.refs.append(attrs['href'])
  if tag in ('script','img','source','iframe') and attrs.get('src'):self.refs.append(attrs['src'])
issues=[];pages=links=0
for host,project in HOSTS.items():
 dist=ROOT/project/'dist'
 for file in dist.rglob('*.html'):
  pages+=1;scan=Scan();scan.feed(file.read_text(encoding='utf-8'));base=urljoin('https://'+host+'/'+file.relative_to(dist).as_posix(),scan.base or '')
  for identifier,count in collections.Counter(scan.ids).items():
   if count>1:issues.append({'page':str(file.relative_to(ROOT)),'duplicate_id':identifier,'count':count})
  for ref in scan.refs:
   url=urlsplit(urljoin(base,ref))
   if url.netloc not in HOSTS or url.scheme not in ('http','https'):continue
   links+=1;target=ROOT/HOSTS[url.netloc]/'dist'/unquote(url.path).lstrip('/')
   if target.is_file() or (target/'index.html').is_file() or (not target.suffix and target.with_suffix('.html').is_file()):continue
   issues.append({'page':str(file.relative_to(ROOT)),'missing':ref})
report={'html_pages':pages,'internal_links_and_assets':links,'issues':issues};output=ROOT/'qa_evidence/full-audit';output.mkdir(parents=True,exist_ok=True)
(output/'static-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Static site audit: {pages} HTML pages, {links} internal links/assets, {len(issues)} issues.')
if issues:raise SystemExit(json.dumps(issues,ensure_ascii=False))
