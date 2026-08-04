/**
 * /ai-port 配下の読み込み中表示。
 *
 * ニュースやYouTubeの取得を待つあいだ、白紙にせず骨組みを見せます。
 * 実際のレイアウトと同じ形にすることで、内容が入ったときの視覚的なズレを小さくします。
 */
export default function AiPortLoading() {
  return (
    <div className="mx-auto max-w-[88rem] px-5 py-16 sm:px-8" aria-busy="true">
      <p className="sr-only">読み込み中です</p>

      <div className="ai-glass h-8 w-40 animate-pulse rounded-full" />
      <div className="ai-glass mt-6 h-14 w-full max-w-2xl animate-pulse rounded-2xl" />
      <div className="ai-glass mt-3 h-14 w-full max-w-xl animate-pulse rounded-2xl" />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="ai-glass h-40 animate-pulse rounded-2xl"
            style={{ animationDelay: `${index * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
