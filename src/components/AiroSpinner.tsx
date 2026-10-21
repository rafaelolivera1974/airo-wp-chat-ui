type AiroSpinnerProps = {
  size?: number
}

/** Maui ring + sparkles — matches Figma `.Airo Loader Icon` (32px in chat). */
export function AiroSpinner({ size = 32 }: AiroSpinnerProps) {
  const sparklesSize = size * 0.55

  return (
    <div
      className="airo-spinner"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Airo is thinking"
    >
      <img
        src="/assets/spinner.svg"
        alt=""
        className="airo-spinner__ring"
        style={{ width: size, height: size }}
        aria-hidden
      />
      <img
        src="/assets/sparkles-filled.svg"
        alt=""
        className="airo-spinner__sparkles"
        style={{ width: sparklesSize, height: sparklesSize }}
        aria-hidden
      />
    </div>
  )
}
