/** The glow, the dot grid, the grain and, unless turned off, the violet light behind the phone. Plain CSS, and nothing follows the cursor. */
export function Atmosphere({ violet = true }: { violet?: boolean }) {
  return (
    <div aria-hidden="true">
      <div className="l-glow" />
      <div className="l-dots" />
      {violet && <div className="l-glow-violet" />}
      <div className="l-grain" />
    </div>
  );
}
