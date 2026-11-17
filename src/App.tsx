import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DEMO_EVENT } from './data/demo'
import { EventPage } from './pages/EventPage'

export default function App() {
  return (
    <BrowserRouter basename="/amigo-secreto">
      <Routes>
        <Route path="/" element={<Navigate to={`/e/${DEMO_EVENT.publicSlug}`} replace />} />
        <Route path="/e/:eventSlug" element={<EventPage />} />
        <Route path="*" element={<Navigate to={`/e/${DEMO_EVENT.publicSlug}`} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
