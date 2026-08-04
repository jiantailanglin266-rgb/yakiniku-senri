/**
 * 決済ネットワーク（SVG）。
 *
 * 世界地図の概形と、拠点を結ぶ光の弧を描きます。
 * 画像を読み込まないので、どの回線速度でも初期表示が遅れません。
 * 装飾なので `aria-hidden` にし、意味のある情報は本文側に置きます。
 */
export function PaymentNetwork({ className }: { className?: string }) {
  // 主要な決済拠点を模した座標（viewBox 0 0 800 400 上の位置）
  const nodes = [
    { x: 148, y: 148, delay: 0 },
    { x: 236, y: 214, delay: 0.6 },
    { x: 388, y: 128, delay: 1.2 },
    { x: 430, y: 196, delay: 0.3 },
    { x: 556, y: 148, delay: 1.8 },
    { x: 620, y: 186, delay: 0.9 },
    { x: 672, y: 262, delay: 2.4 },
    { x: 300, y: 286, delay: 1.5 },
  ];

  const arcs = [
    [nodes[0], nodes[2]],
    [nodes[2], nodes[4]],
    [nodes[4], nodes[5]],
    [nodes[5], nodes[6]],
    [nodes[0], nodes[1]],
    [nodes[1], nodes[7]],
    [nodes[3], nodes[5]],
    [nodes[2], nodes[3]],
  ] as const;

  return (
    <svg
      viewBox="0 0 800 400"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="cp-arc" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
          <stop offset="45%" stopColor="#22d3ee" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="cp-node">
          <stop offset="0%" stopColor="#e0f7ff" stopOpacity="1" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 緯線・経線を模したグリッド。地図そのものではなく「地球規模」の記号です */}
      <g stroke="#3b82f6" strokeOpacity="0.16" fill="none">
        {[80, 140, 200, 260, 320].map((y) => (
          <ellipse key={y} cx="400" cy="200" rx="360" ry={Math.abs(200 - y) + 40} />
        ))}
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <ellipse key={index} cx="400" cy="200" rx={60 + index * 60} ry="180" />
        ))}
      </g>

      <g fill="none" stroke="url(#cp-arc)" strokeWidth="1.4" strokeLinecap="round">
        {arcs.map(([from, to], index) => {
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2 - 58;
          return (
            <path
              key={index}
              d={`M${from.x} ${from.y} Q${midX} ${midY} ${to.x} ${to.y}`}
              strokeDasharray="7 10"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="34"
                to="0"
                dur={`${2.4 + index * 0.35}s`}
                repeatCount="indefinite"
              />
            </path>
          );
        })}
      </g>

      <g>
        {nodes.map((node, index) => (
          <g key={index}>
            <circle cx={node.x} cy={node.y} r="16" fill="url(#cp-node)" opacity="0.55" />
            <circle cx={node.x} cy={node.y} r="2.6" fill="#e0f7ff">
              <animate
                attributeName="opacity"
                values="0.4;1;0.4"
                dur="3.4s"
                begin={`${node.delay}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}
      </g>
    </svg>
  );
}
