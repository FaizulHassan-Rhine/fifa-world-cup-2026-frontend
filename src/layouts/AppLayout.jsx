import { NavLink, Outlet, useLocation } from "react-router-dom"
import { ScrollToTop } from "../components/ScrollToTop.jsx"

const NAV_LINK =
  "rounded-lg px-3 py-1.5 text-xs font-semibold transition ring-1 ring-inset"

function navClass({ isActive }) {
  return isActive
    ? `${NAV_LINK} bg-emerald-500/15 text-emerald-200 ring-emerald-400/30`
    : `${NAV_LINK} text-zinc-400 ring-transparent hover:bg-zinc-800/80 hover:text-zinc-200`
}

export function AppLayout() {
  const { pathname } = useLocation()
  const isAllFootball = pathname.startsWith("/football")

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-950 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-emerald-950/30 via-zinc-950 to-zinc-950 text-zinc-200">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-zinc-900"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500/90">
              FIFA World Cup 2026™
            </p>
            <h1 className="text-lg font-bold text-white sm:text-xl">
              {isAllFootball ? "All Football" : "World Cup"}
            </h1>
          </div>

          <nav
            className="flex items-center gap-1.5"
            aria-label="Main sections"
          >
            <NavLink to="/" end className={navClass}>
              World Cup
            </NavLink>
            <NavLink to="/football" className={navClass}>
              All Football
            </NavLink>
          </nav>
        </div>
      </header>

      <Outlet />
      <ScrollToTop />
    </div>
  )
}
