import { Route, Routes } from "react-router-dom"
import { AppLayout } from "./layouts/AppLayout.jsx"
import AllFootballPage from "./pages/AllFootballPage.jsx"
import WorldCupPage from "./pages/WorldCupPage.jsx"

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<WorldCupPage />} />
        <Route path="football" element={<AllFootballPage />} />
      </Route>
    </Routes>
  )
}
