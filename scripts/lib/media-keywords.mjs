/**
 * 画像検索キーワードの生成。
 *
 * ■ なぜ生成モデルではなく辞書なのか
 *   検索語がぶれると、取ってくる画像もぶれます。同じ記事から毎回違う語が出ると、
 *   「なぜこの画像が選ばれたのか」を後から説明できません。
 *   ここは**決定的**であることを優先し、日本語の概念 → Commons で通じる英語の
 *   視覚的な語、という対応表にしています。
 *   （生成モデルを挟みたい場合は `deriveKeywords()` の戻り値を差し替えてください。
 *     その場合も、出力を requests.json に残して再現できるようにしてください）
 *
 * ■ 視覚的に表現できる語だけを出します
 *   「還元率」「年会費」「審査」は写真にできません。こうした語には対応語を置かず、
 *   結果として検索されません。写真にできない概念に無理やり画像を当てると、
 *   関連の薄い装飾になります。
 *
 * ■ 固有名詞は出しません
 *   掲載カードはすべて架空です。実在の企業名・ブランド名で画像を探すと、
 *   商標・意匠の問題に直結します。
 */

/**
 * 日本語の語 → 視覚的な英語キーワード。
 *
 * 左側は記事のタイトル・本文・タグ・カテゴリに現れる語。
 * 右側は Wikimedia Commons で実際に写真が見つかる語です。
 */
const visualLexicon = [
  // 決済手段
  {
    match: ["タッチ決済", "コンタクトレス", "非接触"],
    terms: ["contactless payment terminal", "NFC payment"],
  },
  { match: ["QRコード", "QR決済", "コード決済"], terms: ["QR code payment", "QR code scanner"] },
  {
    match: ["スマホ決済", "モバイル決済", "スマートフォン決済"],
    terms: ["smartphone mobile payment", "NFC payment"],
  },
  {
    match: ["電子決済", "キャッシュレス"],
    terms: ["QR code payment terminal", "cashless payment"],
  },
  {
    match: ["ICチップ", "EMV", "チップ"],
    terms: ["EMV chip card reader", "chip and PIN terminal"],
  },
  { match: ["磁気ストライプ"], terms: ["magnetic stripe card reader"] },
  { match: ["決済端末", "レジ", "POS"], terms: ["point of sale terminal", "payment terminal"] },
  { match: ["ATM", "現金"], terms: ["automated teller machine", "banknotes"] },

  // カード・銀行
  { match: ["クレジットカード", "カード"], terms: ["credit card payment", "plastic payment card"] },
  { match: ["デビットカード"], terms: ["debit card payment"] },
  { match: ["銀行", "口座"], terms: ["bank branch interior", "bank building"] },
  { match: ["家計", "支出", "明細"], terms: ["household budget notebook", "receipt paper"] },

  // ポイント・特典
  { match: ["ポイント", "還元"], terms: ["loyalty card", "shopping receipt"] },
  { match: ["マイル", "マイレージ"], terms: ["airport departure board", "airline boarding pass"] },
  { match: ["空港ラウンジ", "ラウンジ"], terms: ["airport lounge", "airport terminal seating"] },
  { match: ["旅行", "海外"], terms: ["airport terminal", "travel luggage"] },
  { match: ["ホテル"], terms: ["hotel lobby", "hotel reception desk"] },
  { match: ["飛行機", "航空"], terms: ["passenger aircraft at gate"] },
  { match: ["新幹線", "鉄道", "電車"], terms: ["train station platform", "railway ticket gate"] },

  // 店舗・生活
  { match: ["コンビニ"], terms: ["convenience store interior"] },
  { match: ["スーパー", "食料品"], terms: ["supermarket checkout", "grocery store aisle"] },
  {
    match: ["ネットショッピング", "EC", "通販"],
    terms: ["online shopping laptop", "parcel delivery box"],
  },
  { match: ["ガソリン", "給油"], terms: ["gas station pump"] },
  { match: ["公共料金", "電気"], terms: ["electricity meter", "utility bill paper"] },

  // 法人
  {
    match: ["法人", "経費", "会計", "個人事業主"],
    terms: ["office desk accounting", "invoice paperwork"],
  },
  { match: ["請求書", "領収書"], terms: ["invoice paperwork", "receipt paper"] },
  { match: ["オフィス", "ビジネス"], terms: ["modern office interior", "business meeting table"] },

  // Web3
  {
    match: ["暗号資産", "仮想通貨", "ビットコイン"],
    terms: ["cryptocurrency physical coin", "bitcoin coin"],
  },
  { match: ["ブロックチェーン"], terms: ["blockchain network diagram", "server rack data center"] },
  {
    match: ["ステーブルコイン"],
    terms: ["digital currency concept", "cryptocurrency exchange screen"],
  },
  { match: ["ウォレット", "財布"], terms: ["hardware wallet device", "leather wallet"] },
  { match: ["NFT", "トークン"], terms: ["digital art display screen"] },
  { match: ["取引所"], terms: ["stock exchange trading screen"] },

  // セキュリティ
  {
    match: ["セキュリティ", "不正利用", "不正", "安全"],
    terms: ["padlock security", "computer security lock"],
  },
  {
    match: ["本人確認", "KYC", "認証"],
    terms: ["identity document scanner", "fingerprint scanner"],
  },
  { match: ["暗号", "暗号化"], terms: ["encryption padlock"] },
  { match: ["フィッシング", "詐欺"], terms: ["phishing warning screen"] },

  // 技術一般
  { match: ["AI", "人工知能"], terms: ["server rack data center", "neural network diagram"] },
  { match: ["データ", "統計"], terms: ["data chart printout"] },
  { match: ["アプリ", "スマートフォン"], terms: ["smartphone in hand", "mobile app screen"] },
];

/** 記事カテゴリ・種別から補う語 */
const categoryTerms = {
  point: ["loyalty card", "shopping receipt"],
  mile: ["airport departure board", "airline boarding pass"],
  travel: ["airport terminal", "travel luggage"],
  business: ["office desk accounting", "invoice paperwork"],
  crypto: ["cryptocurrency physical coin", "blockchain network diagram"],
  web3: ["blockchain network diagram", "cryptocurrency physical coin"],
  security: ["padlock security", "identity document scanner"],
  payment: ["contactless payment terminal", "point of sale terminal"],
  cashless: ["QR code payment", "contactless payment terminal"],
  gold: ["airport lounge", "hotel lobby"],
  platinum: ["airport lounge", "hotel lobby"],
  annualfee: [],
  campaign: [],
};

/**
 * 写真にできない語。ここに当たるだけの記事は、検索語なしになります
 * （＝画像を探しません。装飾のまま残ります）。
 */
const nonVisualTerms = [
  "還元率",
  "年会費",
  "審査",
  "利用限度額",
  "分割",
  "リボ",
  "手数料",
  "保険",
  "規約",
  "ポリシー",
  "免責",
];

/** 全角・半角と大小文字を揃えます */
function normalize(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0));
}

/**
 * 記事の材料から、視覚的な英語キーワードを組み立てます。
 *
 * @param {{title?: string, lead?: string, body?: string[], headings?: string[],
 *          tags?: string[], category?: string, kind?: string}} source
 * @returns {string[]} 重みの高い順のキーワード（最大3件）
 */
export function deriveKeywords(source) {
  const weights = new Map();

  const add = (terms, weight) => {
    for (const term of terms) {
      weights.set(term, (weights.get(term) ?? 0) + weight);
    }
  };

  // タイトルは最重要。次にタグ・見出し、本文は補助
  const fields = [
    { text: normalize(source.title), weight: 5 },
    { text: normalize(source.lead), weight: 3 },
    { text: (source.headings ?? []).map(normalize).join(" "), weight: 3 },
    { text: (source.tags ?? []).map(normalize).join(" "), weight: 4 },
    { text: (source.body ?? []).map(normalize).join(" ").slice(0, 2000), weight: 1 },
  ];

  for (const { text, weight } of fields) {
    if (!text) continue;
    for (const entry of visualLexicon) {
      if (entry.match.some((word) => text.includes(normalize(word)))) {
        add(entry.terms, weight);
      }
    }
  }

  // カテゴリ・種別からの補完（タイトルに語が出ていない記事のため）
  for (const key of [source.category, source.kind]) {
    const terms = categoryTerms[String(key ?? "").toLowerCase()];
    if (terms) add(terms, 2);
  }

  const ranked = [...weights.entries()]
    // 同点は語順を固定して、実行のたびに結果が変わらないようにします
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([term]) => term);

  return ranked.slice(0, 3);
}

/** その記事が「写真にできない話題だけ」かどうか */
export function isNonVisualOnly(source) {
  const text = normalize([source.title, source.lead].filter(Boolean).join(" "));
  if (!text) return true;
  const hitsNonVisual = nonVisualTerms.some((word) => text.includes(normalize(word)));
  return hitsNonVisual && deriveKeywords(source).length === 0;
}

export { visualLexicon, nonVisualTerms };

/**
 * 検索語 → 代替テキストに使う名詞句。
 *
 * ■ これは「画像の説明」ではなく「その枠に何を求めたか」です
 *   代替テキストは読み上げ環境で意味が伝わることが目的です。
 *   取得した画像は関連度 80 点以上で足切りしているため、
 *   検索語と大きく違うものは候補に残りません。
 *   そのうえで、承認時に人が中身を見て直せるようにしています
 *   （requests.json に altJa / altEn を書くと、こちらより優先されます）。
 *
 * ■ 断定しすぎない表現にします
 *   「〜の様子」「〜のイメージ」ではなく、写っている物を素直に書きます。
 *   分からないものを分かったように書かないためです。
 */
const termLabels = {
  "contactless payment terminal": {
    ja: "タッチ決済に対応した決済端末",
    en: "A contactless payment terminal",
  },
  "NFC payment": { ja: "NFCによる非接触決済", en: "An NFC contactless payment" },
  "QR code payment": { ja: "QRコードによる決済", en: "A QR code payment" },
  "QR code scanner": { ja: "QRコードの読み取り機", en: "A QR code scanner" },
  "smartphone mobile payment": {
    ja: "スマートフォンによる決済",
    en: "A smartphone mobile payment",
  },
  "QR code payment terminal": {
    ja: "QRコード決済に対応した端末",
    en: "A QR code payment terminal",
  },
  "cashless payment": { ja: "現金を使わない決済", en: "A cashless payment" },
  "EMV chip card reader": { ja: "ICチップ対応のカードリーダー", en: "An EMV chip card reader" },
  "chip and PIN terminal": { ja: "暗証番号を入力する決済端末", en: "A chip and PIN terminal" },
  "magnetic stripe card reader": {
    ja: "磁気ストライプのカードリーダー",
    en: "A magnetic stripe card reader",
  },
  "point of sale terminal": { ja: "店舗のレジ端末", en: "A point of sale terminal" },
  "payment terminal": { ja: "決済端末", en: "A payment terminal" },
  "automated teller machine": { ja: "現金自動預払機（ATM）", en: "An automated teller machine" },
  banknotes: { ja: "紙幣", en: "Banknotes" },
  "credit card payment": { ja: "クレジットカードでの支払い", en: "A credit card payment" },
  "plastic payment card": { ja: "プラスチック製の決済カード", en: "A plastic payment card" },
  "debit card payment": { ja: "デビットカードでの支払い", en: "A debit card payment" },
  "bank branch interior": { ja: "銀行の店内", en: "The interior of a bank branch" },
  "bank building": { ja: "銀行の建物", en: "A bank building" },
  "household budget notebook": { ja: "家計簿", en: "A household budget notebook" },
  "receipt paper": { ja: "レシート", en: "A paper receipt" },
  "loyalty card": { ja: "ポイントカード", en: "A loyalty card" },
  "shopping receipt": { ja: "買い物のレシート", en: "A shopping receipt" },
  "airport departure board": { ja: "空港の出発案内板", en: "An airport departure board" },
  "airline boarding pass": { ja: "航空券の搭乗券", en: "An airline boarding pass" },
  "airport lounge": { ja: "空港のラウンジ", en: "An airport lounge" },
  "airport terminal seating": { ja: "空港ターミナルの座席", en: "Seating in an airport terminal" },
  "airport terminal": { ja: "空港のターミナル", en: "An airport terminal" },
  "travel luggage": { ja: "旅行用のスーツケース", en: "Travel luggage" },
  "hotel lobby": { ja: "ホテルのロビー", en: "A hotel lobby" },
  "hotel reception desk": { ja: "ホテルのフロント", en: "A hotel reception desk" },
  "passenger aircraft at gate": {
    ja: "搭乗口に停まる旅客機",
    en: "A passenger aircraft at a gate",
  },
  "train station platform": { ja: "駅のホーム", en: "A train station platform" },
  "railway ticket gate": { ja: "駅の改札", en: "A railway ticket gate" },
  "convenience store interior": {
    ja: "コンビニエンスストアの店内",
    en: "The interior of a convenience store",
  },
  "supermarket checkout": { ja: "スーパーのレジ", en: "A supermarket checkout" },
  "grocery store aisle": { ja: "食料品売り場の通路", en: "A grocery store aisle" },
  "online shopping laptop": {
    ja: "ノートパソコンでのネットショッピング",
    en: "Online shopping on a laptop",
  },
  "parcel delivery box": { ja: "配送用の段ボール箱", en: "A parcel delivery box" },
  "gas station pump": { ja: "ガソリンスタンドの給油機", en: "A gas station pump" },
  "electricity meter": { ja: "電力メーター", en: "An electricity meter" },
  "utility bill paper": { ja: "公共料金の請求書", en: "A utility bill" },
  "office desk accounting": { ja: "経理作業をする事務机", en: "Accounting work at an office desk" },
  "invoice paperwork": { ja: "請求書の書類", en: "Invoice paperwork" },
  "modern office interior": { ja: "オフィスの室内", en: "A modern office interior" },
  "business meeting table": { ja: "会議用のテーブル", en: "A business meeting table" },
  "cryptocurrency physical coin": {
    ja: "暗号資産を模したコイン",
    en: "A physical cryptocurrency coin",
  },
  "bitcoin coin": { ja: "ビットコインを模したコイン", en: "A bitcoin coin" },
  "blockchain network diagram": {
    ja: "ブロックチェーンの構造図",
    en: "A blockchain network diagram",
  },
  "server rack data center": {
    ja: "データセンターのサーバーラック",
    en: "Server racks in a data center",
  },
  "digital currency concept": {
    ja: "デジタル通貨を表す図",
    en: "A digital currency concept image",
  },
  "cryptocurrency exchange screen": {
    ja: "暗号資産取引の画面",
    en: "A cryptocurrency exchange screen",
  },
  "hardware wallet device": { ja: "ハードウェアウォレット", en: "A hardware wallet device" },
  "leather wallet": { ja: "革製の財布", en: "A leather wallet" },
  "digital art display screen": {
    ja: "デジタル作品を表示する画面",
    en: "A digital art display screen",
  },
  "stock exchange trading screen": {
    ja: "取引画面のディスプレイ",
    en: "A stock exchange trading screen",
  },
  "padlock security": { ja: "施錠された南京錠", en: "A padlock representing security" },
  "computer security lock": {
    ja: "情報セキュリティを表す錠前",
    en: "A lock representing computer security",
  },
  "identity document scanner": {
    ja: "本人確認書類の読み取り機",
    en: "An identity document scanner",
  },
  "fingerprint scanner": { ja: "指紋認証の読み取り機", en: "A fingerprint scanner" },
  "encryption padlock": { ja: "暗号化を表す錠前", en: "A padlock representing encryption" },
  "phishing warning screen": { ja: "フィッシングの警告画面", en: "A phishing warning screen" },
  "neural network diagram": { ja: "ニューラルネットワークの図", en: "A neural network diagram" },
  "data chart printout": { ja: "印刷されたデータのグラフ", en: "A printed data chart" },
  "smartphone in hand": { ja: "手に持ったスマートフォン", en: "A smartphone held in a hand" },
  "mobile app screen": { ja: "スマートフォンのアプリ画面", en: "A mobile app screen" },
};

/**
 * 検索語から代替テキストを組み立てます。
 * 対応表に無い語は、その語をそのまま使います（推測で言い換えません）。
 */
export function altTextFor(term, locale) {
  const label = termLabels[term];
  if (!label) return term;
  return locale === "ja" ? label.ja : label.en;
}

export { termLabels };

/**
 * 検索語 → Wikipedia の記事タイトル。
 *
 * ■ なぜ全文検索ではなくタイトル直指定なのか
 *   Commons の全文検索は、ファイル名や説明にたまたま語が入っただけの画像を拾います。
 *   記事タイトルを直接指定して**その記事の代表画像**を取ると、
 *   「その概念を説明するために選ばれた1枚」が返るため、当たりが桁違いに良くなります。
 *   （既存の別サイト mountain-peak が 198 座すべての写真を集められている方法です）
 *
 * ■ ただし代表画像をそのまま採用はしません
 *   Wikipedia の記事画像には、各言語版へローカルアップロードされた
 *   フェアユース画像が混ざります。取得後に「そのファイルが Commons にあるか」
 *   「ライセンスと作者が読めるか」を必ず確認します（scripts/wikimedia-sync.mjs）。
 *
 * ■ 対応表に無い語は、従来どおり全文検索にまわします
 */
const wikipediaTitles = {
  "contactless payment terminal": { lang: "en", titles: ["Contactless payment"] },
  "NFC payment": { lang: "en", titles: ["Near-field communication"] },
  "QR code payment": { lang: "en", titles: ["QR code"] },
  "QR code scanner": { lang: "en", titles: ["Barcode reader"] },
  "smartphone mobile payment": { lang: "en", titles: ["Mobile payment"] },
  "QR code payment terminal": { lang: "en", titles: ["QR code"] },
  "cashless payment": { lang: "en", titles: ["Cashless society"] },
  "EMV chip card reader": { lang: "en", titles: ["EMV"] },
  "chip and PIN terminal": { lang: "en", titles: ["EMV"] },
  "magnetic stripe card reader": { lang: "en", titles: ["Magnetic stripe card"] },
  "point of sale terminal": { lang: "en", titles: ["Point of sale"] },
  "payment terminal": { lang: "en", titles: ["Payment terminal"] },
  "automated teller machine": { lang: "en", titles: ["Automated teller machine"] },
  banknotes: { lang: "en", titles: ["Banknote"] },
  "credit card payment": { lang: "en", titles: ["Credit card"] },
  "plastic payment card": { lang: "en", titles: ["Payment card"] },
  "debit card payment": { lang: "en", titles: ["Debit card"] },
  "bank branch interior": { lang: "en", titles: ["Bank"] },
  "bank building": { lang: "en", titles: ["Bank"] },
  "household budget notebook": { lang: "en", titles: ["Personal budget"] },
  "receipt paper": { lang: "en", titles: ["Receipt"] },
  "loyalty card": { lang: "en", titles: ["Loyalty program"] },
  "shopping receipt": { lang: "en", titles: ["Receipt"] },
  "airport departure board": { lang: "en", titles: ["Flight information display system"] },
  "airline boarding pass": { lang: "en", titles: ["Boarding pass"] },
  "airport lounge": { lang: "en", titles: ["Airport lounge"] },
  "airport terminal seating": { lang: "en", titles: ["Airport terminal"] },
  "airport terminal": { lang: "en", titles: ["Airport terminal"] },
  "travel luggage": { lang: "en", titles: ["Baggage"] },
  "hotel lobby": { lang: "en", titles: ["Lobby (room)"] },
  "hotel reception desk": { lang: "en", titles: ["Receptionist"] },
  "passenger aircraft at gate": { lang: "en", titles: ["Airliner"] },
  "train station platform": { lang: "en", titles: ["Railway platform"] },
  "railway ticket gate": { lang: "en", titles: ["Ticket barrier"] },
  "convenience store interior": { lang: "en", titles: ["Convenience store"] },
  "supermarket checkout": { lang: "en", titles: ["Supermarket"] },
  "grocery store aisle": { lang: "en", titles: ["Grocery store"] },
  "online shopping laptop": { lang: "en", titles: ["Online shopping"] },
  "parcel delivery box": { lang: "en", titles: ["Parcel (package)"] },
  "gas station pump": { lang: "en", titles: ["Filling station"] },
  "electricity meter": { lang: "en", titles: ["Electricity meter"] },
  "utility bill paper": { lang: "en", titles: ["Invoice"] },
  "office desk accounting": { lang: "en", titles: ["Accounting"] },
  "invoice paperwork": { lang: "en", titles: ["Invoice"] },
  "modern office interior": { lang: "en", titles: ["Office"] },
  "business meeting table": { lang: "en", titles: ["Meeting"] },
  "cryptocurrency physical coin": { lang: "en", titles: ["Cryptocurrency"] },
  "bitcoin coin": { lang: "en", titles: ["Bitcoin"] },
  "blockchain network diagram": { lang: "en", titles: ["Blockchain"] },
  "server rack data center": { lang: "en", titles: ["Data center"] },
  "digital currency concept": { lang: "en", titles: ["Digital currency"] },
  "cryptocurrency exchange screen": { lang: "en", titles: ["Cryptocurrency exchange"] },
  "hardware wallet device": { lang: "en", titles: ["Cryptocurrency wallet"] },
  "leather wallet": { lang: "en", titles: ["Wallet"] },
  "digital art display screen": { lang: "en", titles: ["Digital art"] },
  "stock exchange trading screen": { lang: "en", titles: ["Stock exchange"] },
  "padlock security": { lang: "en", titles: ["Padlock"] },
  "computer security lock": { lang: "en", titles: ["Computer security"] },
  "identity document scanner": { lang: "en", titles: ["Identity document"] },
  "fingerprint scanner": { lang: "en", titles: ["Fingerprint scanner"] },
  "encryption padlock": { lang: "en", titles: ["Encryption"] },
  "phishing warning screen": { lang: "en", titles: ["Phishing"] },
  "neural network diagram": { lang: "en", titles: ["Artificial neural network"] },
  "data chart printout": { lang: "en", titles: ["Chart"] },
  "smartphone in hand": { lang: "en", titles: ["Smartphone"] },
  "mobile app screen": { lang: "en", titles: ["Mobile app"] },
};

/** 検索語に対応する Wikipedia 記事タイトル。無ければ null（全文検索へ回します） */
export function wikipediaTitlesFor(term) {
  return wikipediaTitles[term] ?? null;
}

export { wikipediaTitles };
