/**
 * ヒーローの立体グラフィック。
 *
 * ■ 3Dライブラリを使っていません
 *   これは「回る球体・輪・粒子」だけの表現なので、
 *   CSS の 3D 変換（perspective / rotate3d）とグラデーションで作れます。
 *   Three.js / Spline を入れると初回に数百KB〜数MBのJSが増え、
 *   このサイトが最重視している表示速度を確実に落とします。
 *   ここは「軽さを保ったまま、どこまで作れるか」を優先しています。
 *
 * ■ 動きはすべて transform / opacity のみ
 *   レイアウトを再計算させないので、スクロール中もコマ落ちしません。
 *   prefers-reduced-motion では ai-port.css 側で停止します。
 */
export function HeroOrb() {
  return (
    <div
      aria-hidden="true"
      className="ai-orb relative mx-auto aspect-square w-full max-w-[30rem] select-none"
    >
      {/* 後光 */}
      <div className="from-ai-cyan/25 via-ai-violet/20 absolute inset-[8%] rounded-full bg-gradient-to-br to-transparent blur-3xl" />

      {/* 軌道リング（3枚を別々の角度・速度で回す） */}
      <div className="ai-orbit ai-orbit-a border-ai-cyan/35 absolute inset-[4%] rounded-full border" />
      <div className="ai-orbit ai-orbit-b border-ai-violet/30 absolute inset-[13%] rounded-full border" />
      <div className="ai-orbit ai-orbit-c border-ai-pink/25 absolute inset-[22%] rounded-full border" />

      {/* 核 */}
      <div className="absolute inset-[31%] rounded-full bg-[radial-gradient(circle_at_32%_28%,#8ff5ff_0%,#4d6dff_38%,#7c3aed_66%,#1b1140_100%)] shadow-[0_0_90px_-10px_rgba(77,109,255,0.85)]">
        {/* ハイライトと陰で球に見せます */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.65)_0%,transparent_42%)]" />
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_74%_82%,rgba(4,6,15,0.7)_0%,transparent_52%)]" />
        {/* 経線 — ホログラムらしさ */}
        <div className="ai-orb-mesh absolute inset-0 overflow-hidden rounded-full opacity-45" />
      </div>

      {/* 周回するノード */}
      <div className="ai-orbit ai-orbit-a absolute inset-[4%]">
        <span className="bg-ai-cyan absolute top-0 left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_18px_4px_rgba(46,230,255,0.65)]" />
      </div>
      <div className="ai-orbit ai-orbit-b absolute inset-[13%]">
        <span className="bg-ai-pink absolute top-1/2 right-0 size-2 translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_16px_4px_rgba(255,79,216,0.6)]" />
      </div>
      <div className="ai-orbit ai-orbit-c absolute inset-[22%]">
        <span className="bg-ai-mint absolute bottom-0 left-1/2 size-1.5 -translate-x-1/2 translate-y-1/2 rounded-full shadow-[0_0_14px_3px_rgba(94,234,212,0.6)]" />
      </div>

      {/* データの流れ（縦に落ちる光の筋） */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full [mask-image:radial-gradient(circle,#000_55%,transparent_78%)]">
        {[12, 32, 52, 72, 88].map((left, index) => (
          <span
            key={left}
            className="from-ai-cyan/0 via-ai-cyan/70 to-ai-cyan/0 absolute top-0 h-1/3 w-px bg-gradient-to-b"
            style={{
              left: `${left}%`,
              animation: `ai-rain ${4.5 + index * 0.9}s linear ${index * 0.7}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
