import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AgentProvider } from './contexts/AgentContext';
import AppLayout from './components/Layout/AppLayout';
import Dashboard from './pages/Dashboard';
import DailyReport from './pages/DailyReport';
import WeeklyReport from './pages/WeeklyReport';
import MonthlyReport from './pages/MonthlyReport';
import SessionReport from './pages/SessionReport';
import BlocksReport from './pages/BlocksReport';

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <BrowserRouter>
        <AgentProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/daily" element={<DailyReport />} />
              <Route path="/weekly" element={<WeeklyReport />} />
              <Route path="/monthly" element={<MonthlyReport />} />
              <Route path="/session" element={<SessionReport />} />
              <Route path="/blocks" element={<BlocksReport />} />
            </Routes>
          </AppLayout>
        </AgentProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
}
