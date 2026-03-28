import { Outlet } from 'react-router-dom'

export function MainLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <span>Roots & Recipes</span>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
