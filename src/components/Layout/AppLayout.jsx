import { useState } from 'react';
import { Layout, Menu, Typography, Segmented } from 'antd';
import {
  DashboardOutlined,
  CalendarOutlined,
  TeamOutlined,
  AppstoreOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAgent } from '../../contexts/AgentContext';

const { Sider, Header, Content } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '总览' },
  { key: '/daily', icon: <CalendarOutlined />, label: '日报' },
  { key: '/weekly', icon: <AppstoreOutlined />, label: '周报' },
  { key: '/monthly', icon: <BarChartOutlined />, label: '月报' },
  { key: '/session', icon: <TeamOutlined />, label: '会话' },
  { key: '/blocks', icon: <AppstoreOutlined />, label: '计费块' },
];

const AGENT_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: 'Claude', value: 'claude' },
  { label: 'Codex', value: 'codex' },
  { label: 'OpenCode', value: 'opencode' },
];

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { agent, setAgent } = useAgent();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={200}
        style={{ background: '#fff' }}
      >
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Title level={5} style={{ margin: 0, whiteSpace: 'nowrap' }}>
            {collapsed ? 'CC' : 'ccusage'}
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>用量仪表板</Title>
          <Segmented
            options={AGENT_OPTIONS}
            value={agent}
            onChange={(val) => setAgent(val)}
            size="small"
          />
        </Header>
        <Content style={{ margin: 24 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
