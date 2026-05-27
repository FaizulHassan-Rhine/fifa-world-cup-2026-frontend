import { Route, Routes } from "react-router-dom"
import { AppLayout } from "./layouts/AppLayout.jsx"
import WorldCupPage from "./pages/WorldCupPage.jsx"

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<WorldCupPage />} />
      </Route>
    </Routes>
  )
}
