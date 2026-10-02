import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'

const Workspace = lazy(() => import('./pages/Workspace').then((m) => ({ default: m.Workspace })))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/p/:slug"
          element={
            <Suspense fallback={<div className="h-dvh bg-bg" aria-busy="true" />}>
              <Workspace />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
