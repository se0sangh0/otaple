export const BASE_SPOTS = [
  {
    id: "tokyo-animate-ikebukuro",
    city: "tokyo",
    country: "JP",
    name: "애니메이트 이케부쿠로 본점",
    type: "store",
    district: "Ikebukuro",
    tags: ["anime", "goods", "figure", "manga"],
    schedule: { kind: "always", note: "상설 매장" },
    source: "https://www.animate.co.jp/shop/ikebukuro/",
    mapsQuery: "Animate Ikebukuro Main Store"
  },
  {
    id: "tokyo-mandarake-complex",
    city: "tokyo",
    country: "JP",
    name: "만다라케 컴플렉스 아키하바라",
    type: "store",
    district: "Akihabara",
    tags: ["retro", "doujin", "figure", "anime"],
    schedule: { kind: "always", note: "상설 매장" },
    source: "https://www.mandarake.co.jp/",
    mapsQuery: "Mandarake Complex Akihabara"
  },
  {
    id: "tokyo-radio-kaikan",
    city: "tokyo",
    country: "JP",
    name: "아키하바라 라디오회관",
    type: "store",
    district: "Akihabara",
    tags: ["figure", "model", "goods", "collectible"],
    schedule: { kind: "always", note: "상설 복합 쇼핑" },
    source: "https://www.radio-kaikan.jp/",
    mapsQuery: "Akihabara Radio Kaikan"
  },
  {
    id: "tokyo-nakano-broadway",
    city: "tokyo",
    country: "JP",
    name: "나카노 브로드웨이",
    type: "complex",
    district: "Nakano",
    tags: ["retro", "figure", "idol", "anime"],
    schedule: { kind: "always", note: "상설 복합 상점가" },
    source: "https://nakano-broadway.com/",
    mapsQuery: "Nakano Broadway"
  },
  {
    id: "tokyo-atre-akiba-collab",
    city: "tokyo",
    country: "JP",
    name: "아트레 아키하바라 콜라보 팝업",
    type: "cafe",
    district: "Akihabara",
    tags: ["collab-cafe", "anime", "goods"],
    schedule: { kind: "rolling", note: "순환형 콜라보 이벤트/팝업" },
    source: "https://www.atre.co.jp/store/akihabara",
    mapsQuery: "Atre Akihabara"
  },
  {
    id: "tokyo-animate-cafe-ikebukuro",
    city: "tokyo",
    country: "JP",
    name: "애니메이트 카페 이케부쿠로",
    type: "cafe",
    district: "Ikebukuro",
    tags: ["collab-cafe", "anime", "reservation"],
    schedule: { kind: "rolling", note: "작품별 순환형 콜라보" },
    source: "https://www.animatecafe.jp/",
    mapsQuery: "Animate Cafe Ikebukuro"
  },
  {
    id: "tokyo-gigo-3",
    city: "tokyo",
    country: "JP",
    name: "GiGO 아키하바라 3호관",
    type: "store",
    district: "Akihabara",
    tags: ["arcade", "crane", "game"],
    schedule: { kind: "always", note: "상설 아케이드" },
    source: "https://tempo.gendagigo.jp/am/akihabara03/",
    mapsQuery: "GiGO Akihabara 3"
  },
  {
    id: "tokyo-animejapan",
    city: "tokyo",
    country: "JP",
    name: "AnimeJapan (연례)",
    type: "event",
    district: "Ariake",
    tags: ["anime", "industry", "event"],
    schedule: {
      kind: "recurring",
      months: [3],
      note: "매년 3월 말 개최 경향"
    },
    officialCheckRequired: true,
    source: "https://www.anime-japan.jp/",
    mapsQuery: "Tokyo Big Sight"
  },
  {
    id: "tokyo-comiket",
    city: "tokyo",
    country: "JP",
    name: "Comic Market (코미케)",
    type: "event",
    district: "Ariake",
    tags: ["doujin", "cosplay", "event"],
    schedule: {
      kind: "recurring",
      months: [8, 12],
      note: "여름/겨울 연 2회 개최 경향"
    },
    officialCheckRequired: true,
    source: "https://www.comiket.co.jp/",
    mapsQuery: "Tokyo Big Sight"
  },
  {
    id: "tokyo-jump-festa",
    city: "tokyo",
    country: "JP",
    name: "Jump Festa (수도권)",
    type: "event",
    district: "Makuhari",
    tags: ["anime", "manga", "event"],
    schedule: {
      kind: "recurring",
      months: [12],
      note: "매년 12월 개최 경향"
    },
    officialCheckRequired: true,
    source: "https://www.jumpfesta.com/",
    mapsQuery: "Makuhari Messe"
  },
  {
    id: "osaka-animate-nipponbashi",
    city: "osaka",
    country: "JP",
    name: "애니메이트 오사카 닛폰바시",
    type: "store",
    district: "Nipponbashi",
    tags: ["anime", "goods", "manga"],
    schedule: { kind: "always", note: "상설 매장" },
    source: "https://www.animate.co.jp/shop/nipponbashi/",
    mapsQuery: "Animate Osaka Nipponbashi"
  },
  {
    id: "osaka-lashinbang",
    city: "osaka",
    country: "JP",
    name: "라신반 오사카 닛폰바시",
    type: "store",
    district: "Nipponbashi",
    tags: ["used", "goods", "figure", "anime"],
    schedule: { kind: "always", note: "상설 매장" },
    source: "https://www.lashinbang.com/",
    mapsQuery: "Lashinbang Osaka Nipponbashi"
  },
  {
    id: "osaka-dendentown",
    city: "osaka",
    country: "JP",
    name: "덴덴타운",
    type: "complex",
    district: "Nipponbashi",
    tags: ["figure", "retro", "game", "electronics"],
    schedule: { kind: "always", note: "상설 상점가" },
    source: "https://www.denden-town.or.jp/",
    mapsQuery: "Den Den Town Osaka"
  },
  {
    id: "osaka-gigo-namba",
    city: "osaka",
    country: "JP",
    name: "GiGO 난바 아케이드",
    type: "store",
    district: "Namba",
    tags: ["arcade", "game", "crane"],
    schedule: { kind: "always", note: "상설 아케이드" },
    source: "https://tempo.gendagigo.jp/",
    mapsQuery: "GiGO Namba"
  },
  {
    id: "osaka-collabo-cafe-honpo",
    city: "osaka",
    country: "JP",
    name: "콜라보 카페 혼포 (오사카권)",
    type: "cafe",
    district: "Namba",
    tags: ["collab-cafe", "anime", "reservation"],
    schedule: { kind: "rolling", note: "작품별 순환형 콜라보" },
    source: "https://collabocafe-honpo.co.jp/",
    mapsQuery: "Collabo Cafe Honpo Osaka"
  },
  {
    id: "osaka-street-festa",
    city: "osaka",
    country: "JP",
    name: "닛폰바시 스트리트 페스타",
    type: "event",
    district: "Nipponbashi",
    tags: ["cosplay", "event", "anime"],
    schedule: { kind: "recurring", months: [3], note: "매년 봄 개최 경향" },
    officialCheckRequired: true,
    source: "https://www.denden-town.or.jp/street-festa/",
    mapsQuery: "Nipponbashi Osaka"
  },
  {
    id: "seoul-animate-hongdae",
    city: "seoul",
    country: "KR",
    name: "애니메이트 홍대",
    type: "store",
    district: "Hongdae",
    tags: ["anime", "goods", "manga"],
    schedule: { kind: "always", note: "상설 매장" },
    source: "https://www.animate-onlineshop.co.kr/",
    mapsQuery: "애니메이트 홍대"
  },
  {
    id: "seoul-aniplus-shop",
    city: "seoul",
    country: "KR",
    name: "애니플러스샵 합정",
    type: "store",
    district: "Hapjeong",
    tags: ["anime", "goods", "event"],
    schedule: { kind: "always", note: "상설 매장 + 팝업" },
    source: "https://www.aniplustv.com/",
    mapsQuery: "애니플러스샵 합정"
  },
  {
    id: "seoul-ak-plaza-collab",
    city: "seoul",
    country: "KR",
    name: "AK& 홍대 애니/게임 팝업존",
    type: "cafe",
    district: "Hongdae",
    tags: ["collab-cafe", "pop-up", "anime", "game"],
    schedule: { kind: "rolling", note: "시즌별 팝업/콜라보 순환" },
    source: "https://www.akplaza.com/",
    mapsQuery: "AK PLAZA 홍대"
  },
  {
    id: "seoul-yongsan-ipark",
    city: "seoul",
    country: "KR",
    name: "용산 아이파크몰 서브컬쳐 매장군",
    type: "complex",
    district: "Yongsan",
    tags: ["figure", "game", "goods"],
    schedule: { kind: "always", note: "상설 복합 매장" },
    source: "https://www.hdc-iparkmall.com/",
    mapsQuery: "용산 아이파크몰"
  },
  {
    id: "seoul-comic-world",
    city: "seoul",
    country: "KR",
    name: "코믹월드 서울",
    type: "event",
    district: "Convention",
    tags: ["doujin", "cosplay", "event"],
    schedule: {
      kind: "recurring",
      months: [2, 7],
      note: "연 2회 내외 개최 경향"
    },
    officialCheckRequired: true,
    source: "https://www.comicw.co.kr/",
    mapsQuery: "SETEC"
  },
  {
    id: "seoul-illustar",
    city: "seoul",
    country: "KR",
    name: "일러스타 페스",
    type: "event",
    district: "Convention",
    tags: ["illustration", "doujin", "event"],
    schedule: {
      kind: "recurring",
      months: [5, 11],
      note: "연 2회 내외 개최 경향"
    },
    officialCheckRequired: true,
    source: "https://illustar.net/",
    mapsQuery: "KINTEX"
  }
];

export const CITY_ALIASES = {
  tokyo: ["tokyo", "도쿄", "東京"],
  osaka: ["osaka", "오사카", "大阪"],
  seoul: ["seoul", "서울", "ソウル"]
};

export const TYPE_LABEL = {
  event: "이벤트",
  store: "상설 매장",
  cafe: "콜라보 카페/팝업",
  complex: "복합 상권"
};

export const TAG_LABEL = {
  anime: "애니메이션",
  game: "게임",
  figure: "피규어",
  goods: "굿즈",
  manga: "만화",
  doujin: "동인",
  cosplay: "코스프레",
  collab-cafe: "콜라보 카페",
  arcade: "아케이드",
  idol: "아이돌/2.5D",
  retro: "레트로",
  reservation: "예약 권장",
  pop-up: "팝업",
  collectible: "콜렉터블",
  used: "중고",
  illustration: "일러스트"
};
