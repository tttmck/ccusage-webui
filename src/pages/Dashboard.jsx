import { Row, Col, Card, Spin, Result } from 'antd';
import useCcusageData from '../hooks/useCcusageData';
import { fetchDaily, fetchBlocks } from '../api/ccusage';
import { useAgent } from '../contexts/AgentContext';
import SummaryCards from '../components/SummaryCards';
import CostTrendChart from '../components/Charts/CostTrendChart';
import ModelPieChart from '../components/Charts/ModelPieChart';
import TokenTrendChart from '../components/Charts/TokenTrendChart';
import UsageTable from '../components/UsageTable';

export default function Dashboard() {
  const { agent } = useAgent();

  const { data: dailyData, loading: dailyLoading, error: dailyError, refresh: refreshDaily } = useCcusageData(
    () => fetchDaily({ agent }),
    [agent]
  );
  const { data: blocksData, loading: blocksLoading } = useCcusageData(
    () => fetchBlocks({ agent }),
    [agent]
  );

  if (dailyError) {
    return <Result status="error" title="数据加载失败" subTitle={dailyError} extra={<a onClick={refreshDaily}>重试</a>} />;
  }

  const daily = dailyData?.daily || [];
  const totals = dailyData?.totals || {};
  const activeBlocks = (blocksData?.blocks || []).filter((b) => b.isActive);

  const recentDaily = [...daily].sort((a, b) => b.period.localeCompare(a.period)).slice(0, 7);
  const last30Days = daily.length > 30 ? daily.slice(-30) : daily;

  return (
    <Spin spinning={dailyLoading && blocksLoading}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <SummaryCards
            totals={totals}
            extraStats={activeBlocks.length > 0 ? [{
              title: '活跃块',
              value: `$${activeBlocks[0].costUSD?.toFixed(2) ?? '0.00'}`,
              color: '#52c41a',
            }] : []}
          />
        </Col>
        <Col xs={24} lg={14}>
          <CostTrendChart data={last30Days} />
        </Col>
        <Col xs={24} lg={10}>
          <ModelPieChart data={daily} />
        </Col>
        <Col xs={24} lg={14}>
          <TokenTrendChart data={last30Days} />
        </Col>
        <Col span={24}>
          <Card title="近期每日用量" size="small">
            <UsageTable data={recentDaily} loading={dailyLoading} />
          </Card>
        </Col>
      </Row>
    </Spin>
  );
}
