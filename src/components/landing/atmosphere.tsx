/** The glow, the dot grid, the grain and the violet light behind the phone. Plain CSS, and nothing follows the cursor. */
export function Atmosphere() {
  return (
    <div aria-hidden="true">
      <div className="l-glow" />
      <div className="l-dots" />
      <div className="l-glow-violet" />
      <div className="l-grain" />
    </div>
  );
}
