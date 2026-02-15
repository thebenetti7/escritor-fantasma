import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { ConfigWizard } from './pages/ConfigWizard';
import { GhostEditor } from './pages/GhostEditor';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/wizard" element={<ConfigWizard />} />
          <Route path="/editor" element={<GhostEditor />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
