import { Route, Routes } from "react-router-dom"
import { AppLayout } from "./layouts/AppLayout.jsx"
import WorldCupPage from "./pages/WorldCupPage.jsx"
import LiveFootballPage from "./pages/LiveFootballPage.jsx"

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<WorldCupPage />} />
        <Route path="football" element={<LiveFootballPage />} />
      </Route>
    </Routes>
  )
}
