import { NavLink, Outlet } from "react-router-dom"

const navClass = ({ isActive }) =>
  `rounded-md px-2 py-1 text-xs font-semibold transition ${
    isActive
      ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30"
      : "text-emerald-400/90 hover:bg-zinc-800 hover:text-emerald-300"
  }`

export function AppLayout() {
  return (
    <div className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-emerald-950/30 via-zinc-950 to-zinc-950 text-zinc-200">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-zinc-900"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500/90">
              FIFA World Cup 2026™
            </p>
            <h1 className="text-lg font-bold text-white sm:text-xl">
              Schedule &amp; live football
            </h1>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <NavLink to="/" className={navClass} end>
              World Cup
            </NavLink>
            <NavLink to="/football" className={navClass}>
              Live &amp; results
            </NavLink>
          </nav>
        </div>
      </header>

      <Outlet />
    </div>
  )
}
