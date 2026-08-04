/**
 * 画像まわりの UI 文言。
 *
 * ■ 翻訳するもの
 *   「写真」「トリミング済み」「出典を表示」などの**ラベル**だけです。
 *
 * ■ 翻訳しないもの（このファイルに入れてはいけないもの）
 *   - 作者名（人名・団体名）
 *   - 作品名・ファイル名
 *   - ライセンスの正式名称（CC BY-SA 4.0 など）
 *   - "Wikimedia Commons" / "Wikimedia Foundation"
 *   - Commons のURL
 *   これらは原文のまま表示し、`translate="no"` を付けます。
 *   訳してしまうと、ライセンスが要求する「作者の表示」を満たさなくなります。
 */

export type MediaLabels = {
  /** クレジット先頭のラベル。例:「写真」 */
  photo: string;
  /** 加工済みであることの注記 */
  modified: string;
  /**
   * 継承（ShareAlike）の告知。
   * CC BY-SA の画像に手を加えて掲載する場合、改変版も同じ条件で
   * 提供していることを示す必要があります。表示を省くと条件違反です。
   */
  shareAlikeNotice: string;
  /** 出典モーダルを開くボタン */
  detailsLabel: string;
  /** 出典モーダルの見出し */
  detailsTitle: string;
  author: string;
  source: string;
  license: string;
  fileName: string;
  commonsPage: string;
  /** 「作者不明」ではなく「記載なし」。断定しないための表現です */
  notProvided: string;
  /** 出典一覧ページのタイトル */
  creditsTitle: string;
  creditsIntro: string;
  close: string;
  /** ライセンス条件の要約ラベル */
  commercialUse: string;
  derivativeWorks: string;
  shareAlike: string;
  allowed: string;
  notAllowed: string;
  required: string;
  notRequired: string;
  /** 免責 */
  disclaimer: string;
};

/**
 * 日本語を基準にします。未訳の言語は英語へ、英語も無ければ日本語へ落とします。
 */
const ja: MediaLabels = {
  photo: "写真",
  modified: "（当サイトで加工）",
  shareAlikeNotice: "改変あり。この改変版も元画像と同じライセンスで提供します。",
  detailsLabel: "画像の出典とライセンス",
  detailsTitle: "画像の出典とライセンス",
  author: "作者",
  source: "出典",
  license: "ライセンス",
  fileName: "ファイル名",
  commonsPage: "Wikimedia Commons のファイルページ",
  notProvided: "記載なし",
  creditsTitle: "画像の出典一覧",
  creditsIntro:
    "当サイトで使用している画像の作者・出典・ライセンスの一覧です。ライセンス情報を確認できた画像だけを掲載しています。",
  close: "閉じる",
  commercialUse: "商用利用",
  derivativeWorks: "改変",
  shareAlike: "継承（ShareAlike）",
  allowed: "可",
  notAllowed: "不可",
  required: "必要",
  notRequired: "不要",
  disclaimer:
    "ライセンスは著作権についてのものです。写っている人物・商標・建築物などについては、別に権利が及ぶ場合があります。",
};

const en: MediaLabels = {
  photo: "Photo",
  modified: "(modified by this site)",
  shareAlikeNotice: "Modified. This adaptation is offered under the same licence as the original.",
  detailsLabel: "Image source and licence",
  detailsTitle: "Image source and licence",
  author: "Author",
  source: "Source",
  license: "Licence",
  fileName: "File name",
  commonsPage: "File page on Wikimedia Commons",
  notProvided: "Not provided",
  creditsTitle: "Image credits",
  creditsIntro:
    "Authors, sources and licences for the images used on this site. Only images with verifiable licence information are published here.",
  close: "Close",
  commercialUse: "Commercial use",
  derivativeWorks: "Modification",
  shareAlike: "ShareAlike",
  allowed: "Allowed",
  notAllowed: "Not allowed",
  required: "Required",
  notRequired: "Not required",
  disclaimer:
    "A licence covers copyright only. Separate rights may apply to people, trademarks or buildings shown in an image.",
};

/**
 * 部分訳。未訳のキーは英語のままになります（空欄にはしません）。
 */
const partials: Record<string, Partial<MediaLabels>> = {
  ko: {
    photo: "사진",
    modified: "(본 사이트에서 편집)",
    detailsLabel: "이미지 출처 및 라이선스",
    detailsTitle: "이미지 출처 및 라이선스",
    author: "저작자",
    source: "출처",
    license: "라이선스",
    fileName: "파일명",
    commonsPage: "Wikimedia Commons 파일 페이지",
    notProvided: "표기 없음",
    creditsTitle: "이미지 출처 목록",
    close: "닫기",
    commercialUse: "상업적 이용",
    derivativeWorks: "변경",
    shareAlike: "동일조건변경허락",
    allowed: "가능",
    notAllowed: "불가",
    required: "필요",
    notRequired: "불필요",
  },
  "zh-cn": {
    photo: "图片",
    modified: "（本站已加工）",
    detailsLabel: "图片来源与许可协议",
    detailsTitle: "图片来源与许可协议",
    author: "作者",
    source: "来源",
    license: "许可协议",
    fileName: "文件名",
    commonsPage: "Wikimedia Commons 文件页面",
    notProvided: "未标注",
    creditsTitle: "图片来源一览",
    close: "关闭",
    commercialUse: "商业使用",
    derivativeWorks: "修改",
    shareAlike: "相同方式共享",
    allowed: "允许",
    notAllowed: "不允许",
    required: "需要",
    notRequired: "不需要",
  },
  "zh-tw": {
    photo: "圖片",
    modified: "（本站已加工）",
    detailsLabel: "圖片來源與授權條款",
    detailsTitle: "圖片來源與授權條款",
    author: "作者",
    source: "來源",
    license: "授權條款",
    fileName: "檔名",
    commonsPage: "Wikimedia Commons 檔案頁面",
    notProvided: "未標示",
    creditsTitle: "圖片來源一覽",
    close: "關閉",
    commercialUse: "商業使用",
    derivativeWorks: "修改",
    shareAlike: "相同方式分享",
    allowed: "允許",
    notAllowed: "不允許",
    required: "需要",
    notRequired: "不需要",
  },
  es: {
    photo: "Foto",
    modified: "(modificada por este sitio)",
    detailsLabel: "Fuente y licencia de la imagen",
    detailsTitle: "Fuente y licencia de la imagen",
    author: "Autor",
    source: "Fuente",
    license: "Licencia",
    fileName: "Nombre de archivo",
    commonsPage: "Página del archivo en Wikimedia Commons",
    notProvided: "No indicado",
    creditsTitle: "Créditos de las imágenes",
    close: "Cerrar",
    commercialUse: "Uso comercial",
    derivativeWorks: "Modificación",
    shareAlike: "CompartirIgual",
    allowed: "Permitido",
    notAllowed: "No permitido",
    required: "Obligatorio",
    notRequired: "No obligatorio",
  },
  fr: {
    photo: "Photo",
    modified: "(modifiée par ce site)",
    detailsLabel: "Source et licence de l'image",
    detailsTitle: "Source et licence de l'image",
    author: "Auteur",
    source: "Source",
    license: "Licence",
    fileName: "Nom du fichier",
    commonsPage: "Page du fichier sur Wikimedia Commons",
    notProvided: "Non indiqué",
    creditsTitle: "Crédits des images",
    close: "Fermer",
    commercialUse: "Usage commercial",
    derivativeWorks: "Modification",
    shareAlike: "Partage dans les mêmes conditions",
    allowed: "Autorisé",
    notAllowed: "Non autorisé",
    required: "Requis",
    notRequired: "Non requis",
  },
  de: {
    photo: "Foto",
    modified: "(von dieser Website bearbeitet)",
    detailsLabel: "Bildquelle und Lizenz",
    detailsTitle: "Bildquelle und Lizenz",
    author: "Urheber",
    source: "Quelle",
    license: "Lizenz",
    fileName: "Dateiname",
    commonsPage: "Dateiseite auf Wikimedia Commons",
    notProvided: "Nicht angegeben",
    creditsTitle: "Bildnachweise",
    close: "Schließen",
    commercialUse: "Kommerzielle Nutzung",
    derivativeWorks: "Bearbeitung",
    shareAlike: "Weitergabe unter gleichen Bedingungen",
    allowed: "Erlaubt",
    notAllowed: "Nicht erlaubt",
    required: "Erforderlich",
    notRequired: "Nicht erforderlich",
  },
  pt: {
    photo: "Foto",
    modified: "(modificada por este site)",
    detailsLabel: "Fonte e licença da imagem",
    detailsTitle: "Fonte e licença da imagem",
    author: "Autor",
    source: "Fonte",
    license: "Licença",
    fileName: "Nome do arquivo",
    commonsPage: "Página do arquivo no Wikimedia Commons",
    notProvided: "Não informado",
    creditsTitle: "Créditos das imagens",
    close: "Fechar",
    commercialUse: "Uso comercial",
    derivativeWorks: "Modificação",
    shareAlike: "CompartilhaIgual",
    allowed: "Permitido",
    notAllowed: "Não permitido",
    required: "Obrigatório",
    notRequired: "Não obrigatório",
  },
  th: {
    photo: "ภาพ",
    modified: "(ปรับแต่งโดยเว็บไซต์นี้)",
    detailsLabel: "แหล่งที่มาและสัญญาอนุญาตของภาพ",
    detailsTitle: "แหล่งที่มาและสัญญาอนุญาตของภาพ",
    author: "ผู้สร้างสรรค์",
    source: "แหล่งที่มา",
    license: "สัญญาอนุญาต",
    fileName: "ชื่อไฟล์",
    commonsPage: "หน้าไฟล์บน Wikimedia Commons",
    notProvided: "ไม่ระบุ",
    creditsTitle: "รายการแหล่งที่มาของภาพ",
    close: "ปิด",
    commercialUse: "การใช้เชิงพาณิชย์",
    derivativeWorks: "การดัดแปลง",
    shareAlike: "อนุญาตแบบเดียวกัน",
    allowed: "ได้",
    notAllowed: "ไม่ได้",
    required: "จำเป็น",
    notRequired: "ไม่จำเป็น",
  },
  vi: {
    photo: "Ảnh",
    modified: "(đã chỉnh sửa bởi trang này)",
    detailsLabel: "Nguồn và giấy phép của ảnh",
    detailsTitle: "Nguồn và giấy phép của ảnh",
    author: "Tác giả",
    source: "Nguồn",
    license: "Giấy phép",
    fileName: "Tên tệp",
    commonsPage: "Trang tệp trên Wikimedia Commons",
    notProvided: "Không ghi",
    creditsTitle: "Danh sách nguồn ảnh",
    close: "Đóng",
    commercialUse: "Sử dụng thương mại",
    derivativeWorks: "Sửa đổi",
    shareAlike: "Chia sẻ tương tự",
    allowed: "Được phép",
    notAllowed: "Không được phép",
    required: "Bắt buộc",
    notRequired: "Không bắt buộc",
  },
  id: {
    photo: "Foto",
    modified: "(diubah oleh situs ini)",
    detailsLabel: "Sumber dan lisensi gambar",
    detailsTitle: "Sumber dan lisensi gambar",
    author: "Pencipta",
    source: "Sumber",
    license: "Lisensi",
    fileName: "Nama berkas",
    commonsPage: "Halaman berkas di Wikimedia Commons",
    notProvided: "Tidak dicantumkan",
    creditsTitle: "Daftar sumber gambar",
    close: "Tutup",
    commercialUse: "Penggunaan komersial",
    derivativeWorks: "Modifikasi",
    shareAlike: "BerbagiSerupa",
    allowed: "Diizinkan",
    notAllowed: "Tidak diizinkan",
    required: "Wajib",
    notRequired: "Tidak wajib",
  },
  ar: {
    photo: "صورة",
    modified: "(عُدّلت بواسطة هذا الموقع)",
    detailsLabel: "مصدر الصورة والرخصة",
    detailsTitle: "مصدر الصورة والرخصة",
    author: "المؤلف",
    source: "المصدر",
    license: "الرخصة",
    fileName: "اسم الملف",
    commonsPage: "صفحة الملف على Wikimedia Commons",
    notProvided: "غير مذكور",
    creditsTitle: "قائمة مصادر الصور",
    close: "إغلاق",
    commercialUse: "الاستخدام التجاري",
    derivativeWorks: "التعديل",
    shareAlike: "المشاركة بالمثل",
    allowed: "مسموح",
    notAllowed: "غير مسموح",
    required: "مطلوب",
    notRequired: "غير مطلوب",
  },
  hi: {
    photo: "चित्र",
    modified: "(इस साइट द्वारा संपादित)",
    detailsLabel: "चित्र का स्रोत और लाइसेंस",
    detailsTitle: "चित्र का स्रोत और लाइसेंस",
    author: "रचयिता",
    source: "स्रोत",
    license: "लाइसेंस",
    fileName: "फ़ाइल नाम",
    commonsPage: "Wikimedia Commons पर फ़ाइल पृष्ठ",
    notProvided: "उल्लेख नहीं",
    creditsTitle: "चित्र स्रोत सूची",
    close: "बंद करें",
    commercialUse: "व्यावसायिक उपयोग",
    derivativeWorks: "संशोधन",
    shareAlike: "समान रूप से साझा",
    allowed: "अनुमत",
    notAllowed: "अनुमत नहीं",
    required: "आवश्यक",
    notRequired: "आवश्यक नहीं",
  },
};

const cache = new Map<string, MediaLabels>();

/** 言語コードに対応するラベル一式を返します */
export function getMediaLabels(locale: string): MediaLabels {
  const cached = cache.get(locale);
  if (cached) return cached;

  let labels: MediaLabels;
  if (locale === "ja") {
    labels = ja;
  } else if (locale === "en") {
    labels = en;
  } else {
    labels = { ...en, ...(partials[locale] ?? {}) };
  }

  cache.set(locale, labels);
  return labels;
}

export { ja as jaMediaLabels, en as enMediaLabels };
