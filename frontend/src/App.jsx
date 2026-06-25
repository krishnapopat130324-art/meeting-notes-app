import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import MeetingRoom from './MeetingRoom';

function AppContent() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<Dashboard onSelectMeeting={(id) => navigate(`/meeting/${id}`)} />} />
      <Route path="/meeting/:id" element={<MeetingRoom />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;