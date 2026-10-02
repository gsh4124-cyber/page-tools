#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const CHAPTER_COUNTS = {
  Genesis:50, Exodus:40, Leviticus:27, Numbers:36, Deuteronomy:34,
  Joshua:24, Judges:21, Ruth:4, '1Samuel':31, '2Samuel':24,
  '1Kings':22, '2Kings':25, '1Chronicles':29, '2Chronicles':36, Ezra:10,
  Nehemiah:13, Esther:10, Job:42, Psalms:150, Proverbs:31,
  Ecclesiastes:12, SongofSolomon:8, Isaiah:66, Jeremiah:52, Lamentations:5,
  Ezekiel:48, Daniel:12, Hosea:14, Joel:3, Amos:9,
  Obadiah:1, Jonah:4, Micah:7, Nahum:3, Habakkuk:3,
  Zephaniah:3, Haggai:2, Zechariah:14, Malachi:4,
  Matthew:28, Mark:16, Luke:24, John:21, Acts:28,
  Romans:16, '1Corinthians':16, '2Corinthians':13, Galatians:6, Ephesians:6,
  Philippians:4, Colossians:4, '1Thessalonians':5, '2Thessalonians':3,
  '1Timothy':6, '2Timothy':4, Titus:3, Philemon:1, Hebrews:13,
  James:5, '1Peter':5, '2Peter':3, '1John':5, '2John':1,
  '3John':1, Jude:1, Revelation:22
};

const MARKER_TYPES = new Set(['보','비','인','?','히','헬','']);
const REF_RE = /^(?:[1-3]?[A-Za-z]+)\s+\d+(?::\d+(?:-\d+)?)?(?:\s*,\s*(?:[1-3]?[A-Za-z]+)\s+\d+(?::\d+(?:-\d+)?)?)*$/;

function fail(errors, message) { errors.push(message); }
function warn(warnings, message) { warnings.push(message); }

function parseKey(key, expectedParts, errors) {
  const parts = key.split(':');
  if (parts.length !== expectedParts) {
    fail(errors, `잘못된 키 형식: ${key}`);
    return null;
  }
  const [book, chRaw, verseRaw] = parts;
  if (!(book in CHAPTER_COUNTS)) fail(errors, `알 수 없는 책 코드: ${book} (${key})`);
  const chapter = Number(chRaw);
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > (CHAPTER_COUNTS[book] ?? 0)) fail(errors, `장 범위 오류: ${key}`);
  let verse = null;
  if (expectedParts === 3) {
    verse = Number(verseRaw);
    if (!Number.isInteger(verse) || verse < 1) fail(errors, `절 번호 오류: ${key}`);
  }
  return { book, chapter, verse };
}

function loadAnnotationFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: filePath });
  return sandbox.window.KRV_ANNOTATIONS;
}

const input = process.argv[2] || path.resolve('annotations-data.js');
const errors = [];
const warnings = [];
let data;

try {
  data = loadAnnotationFile(input);
} catch (error) {
  console.error(`파일을 읽지 못했습니다: ${input}`);
  console.error(error.message);
  process.exit(2);
}

if (!data || typeof data !== 'object') {
  console.error('window.KRV_ANNOTATIONS 객체를 찾지 못했습니다.');
  process.exit(2);
}

if (!data.source) fail(errors, 'source가 비어 있습니다.');
if (!data.edition) warn(warnings, 'edition 정보가 없습니다.');
if (!data.publisher) warn(warnings, 'publisher 정보가 없습니다.');

const headings = data.headings || {};
for (const [key, items] of Object.entries(headings)) {
  parseKey(key, 2, errors);
  if (!Array.isArray(items)) { fail(errors, `소제목 배열이 아님: ${key}`); continue; }
  const seen = new Set();
  for (const [index, item] of items.entries()) {
    const label = `${key} headings[${index}]`;
    if (!Number.isInteger(Number(item?.verse)) || Number(item.verse) < 1) fail(errors, `${label}: verse 오류`);
    if (!String(item?.text || '').trim()) fail(errors, `${label}: text 비어 있음`);
    const fingerprint = `${item?.verse}|${item?.text}`;
    if (seen.has(fingerprint)) fail(errors, `${label}: 중복 소제목`);
    seen.add(fingerprint);
    if (item?.sourcePage == null) warn(warnings, `${label}: sourcePage 없음`);
  }
}

const notes = data.notes || {};
for (const [key, items] of Object.entries(notes)) {
  parseKey(key, 3, errors);
  if (!Array.isArray(items)) { fail(errors, `관주 배열이 아님: ${key}`); continue; }
  const seen = new Set();
  for (const [index, item] of items.entries()) {
    const label = `${key} notes[${index}]`;
    const marker = String(item?.marker || '').trim();
    const type = String(item?.type || '').trim();
    const text = String(item?.text || '').trim();
    const refs = Array.isArray(item?.refs) ? item.refs : [];
    if (!marker) warn(warnings, `${label}: marker 없음`);
    if (!MARKER_TYPES.has(type) && type) warn(warnings, `${label}: 알려지지 않은 type '${type}'`);
    if (!text && refs.length === 0) fail(errors, `${label}: text와 refs가 모두 비어 있음`);
    for (const ref of refs) {
      if (!REF_RE.test(String(ref).trim())) warn(warnings, `${label}: 참조 형식 확인 필요 '${ref}'`);
    }
    const fingerprint = `${marker}|${type}|${refs.join(';')}|${text}`;
    if (seen.has(fingerprint)) fail(errors, `${label}: 중복 관주`);
    seen.add(fingerprint);
    if (item?.sourcePage == null) warn(warnings, `${label}: sourcePage 없음`);
  }
}

console.log(`검사 파일: ${input}`);
console.log(`소제목 장 키: ${Object.keys(headings).length}`);
console.log(`관주 절 키: ${Object.keys(notes).length}`);
console.log(`오류: ${errors.length}, 경고: ${warnings.length}`);

if (warnings.length) {
  console.log('\n[경고]');
  warnings.forEach((m) => console.log(`- ${m}`));
}
if (errors.length) {
  console.log('\n[오류]');
  errors.forEach((m) => console.log(`- ${m}`));
  process.exit(1);
}

console.log('\nPASS: 구조 검사가 통과했습니다. 원본 이미지 대조 검수는 별도로 필요합니다.');
