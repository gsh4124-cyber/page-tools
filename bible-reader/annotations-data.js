window.KRV_ANNOTATIONS = {
  source: "관주성경전서 개역한글판(1962)",
  publisher: "대한성서공회",
  rights: "저작재산권 보호기간 만료(2012-12-31); 성명표시권·동일성유지권 존중",
  status: "schema-ready-source-pending",
  editionVerified: false,
  headings: {},
  notes: {}
};

/*
원자료 수입 형식 — 실제 1962 관주판과 대조한 데이터만 넣는다.

1) 소제목
headings: {
  "John:3": [
    {
      verse: 1,              // 이 절 바로 앞에 소제목 표시
      text: "소제목 원문",  // 원자료 표기를 그대로 보존
      sourcePage: 123        // 선택: 검수용 원본 쪽수
    }
  ]
}

2) 난하주 / 관주
notes: {
  "John:3:16": [
    {
      marker: "ㄱ",         // 원문 기호 그대로
      type: "보",           // 보/비/인/?/히/헬 등. 없으면 ""
      refs: [                // 연결 성구는 구조화해서 저장
        { book: "Gen", chapter: 1, verse: 1 },
        { book: "Rom", chapter: 5, verse: 8 }
      ],
      text: "",             // 원자료에 별도 설명이 있는 경우만 기록
      sourcePage: 123        // 선택: 검수용 원본 쪽수
    }
  ]
}

원칙:
- AI가 관주·소제목을 생성하거나 현대 관주를 1962판처럼 섞지 않는다.
- 철자·기호·순서·연결구절을 원자료 그대로 옮긴다.
- 입력 후 책/장/절 유효성, 중복, 누락을 별도 검증한다.
*/
