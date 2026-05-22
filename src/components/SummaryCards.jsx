import { Row, Col, Card, Statistic } from 'antd';
import { DollarOutlined, DatabaseOutlined, CloudUploadOutlined, CloudDownloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { formatCost, formatTokens } from '../utils/formatters';

export default function SummaryCards({ totals, extraStats }) {
  const items = [
    {
      title: '总费用',
      value: formatCost(totals?.totalCost ?? 0),
      icon: <DollarOutlined />,
      color: '#cf1322',
    },
    {
      title: '总 Token',
      value: formatTokens(totals?.totalTokens ?? 0),
      icon: <DatabaseOutlined />,
      color: '#1677ff',
    },
    {
      title: '输入 Token',
      value: formatTokens(totals?.inputTokens ?? 0),
      icon: <CloudUploadOutlined />,
      color: '#722ed1',
    },
    {
      title: '输出 Token',
      value: formatTokens(totals?.outputTokens ?? 0),
      icon: <CloudDownloadOutlined />,
      color: '#13c2c2',
    },
    {
      title: '缓存读取',
      value: formatTokens(totals?.cacheReadTokens ?? 0),
      icon: <ThunderboltOutlined />,
      color: '#fa8c16',
    },
  ];

  if (extraStats) {
    items.push(...extraStats);
  }

  return (
    <Row gutter={[16, 16]}>
      {items.map((item) => (
        <Col xs={24} sm={12} md={8} lg={items.length <= 5 ? 4 : 3} key={item.title}>
          <Card size="small">
            <Statistic
              title={item.title}
              value={item.value}
              prefix={item.icon}
              valueStyle={{ color: item.color, fontSize: item.value && item.value.length > 10 ? 16 : 20 }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
