import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import RoomPage from './pages/RoomPage'
import { ViewportProvider } from './contexts'

function App() {
    return (
        <ViewportProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/room/:roomCode" element={<RoomPage />} />
                </Routes>
            </div>
        </ViewportProvider>
    )
}

export default App
