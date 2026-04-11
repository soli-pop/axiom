import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SupabaseTest from './SupabaseTest'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SupabaseTest />
  </StrictMode>
)
