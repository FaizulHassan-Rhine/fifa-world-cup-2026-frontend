/**
 * Gradient-border wrapper for match cards.
 *
 * @param {{
 *   chrome: import("../utils/matchCardChrome.js").MatchCardChrome
 *   children: import("react").ReactNode
 *   className?: string
 *   articleClassName?: string
 * } & import("react").HTMLAttributes<HTMLElement>} props
 */
export function MatchCardShell({
  chrome,
  children,
  className = "",
  articleClassName = "",
  ...articleProps
}) {
  return (
    <div
      className={`min-w-0 max-w-full rounded-2xl p-px transition duration-300 ease-out ${chrome.frame} ${chrome.hover ?? ""} ${className}`}
    >
      <article
        {...articleProps}
        className={`relative flex h-full flex-col overflow-hidden rounded-[calc(1rem-1px)] ${chrome.card} ${articleClassName}`}
      >
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r ${chrome.bar}`}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.05),transparent)]"
          aria-hidden
        />
        {children}
      </article>
    </div>
  )
}
