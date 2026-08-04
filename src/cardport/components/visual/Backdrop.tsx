/**
 * 背景レイヤー（背景 → グリッド → ノイズ）。
 *
 * すべて CSS のみで描画します。WebGL を使わないので、
 * 低スペック端末でもフレーム落ちせず、初期表示のJSも増えません。
 */
export function Backdrop() {
  return (
    <>
      <div className="port-canvas" aria-hidden="true" />
      <div className="port-grid" aria-hidden="true" />
      <div className="port-grain" aria-hidden="true" />
    </>
  );
}
