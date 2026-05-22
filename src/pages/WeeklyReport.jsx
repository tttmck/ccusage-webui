import { useState } from 'react';
import { Row, Col, Spin, Result } from 'antd';
import useCcusageData from '../hooks/useCcusageData';
import { fetchWeekly } from '../api/ccusage';
import { useAgent } from '../contexts/AgentContext';
import SummaryCards from '../components/SummaryCards';
import DateRangeFilter from '../components/DateRangeFilter';
import TokenTrendChart from '../components/Charts/TokenTrendChart';
import CostTrendChart from '../components/Charts/CostTrendChart';
import UsageTable from '../components/UsageTable';

export default function WeeklyReport() {
  const { agent } = useAgent();
  const [params, setParams] = useState({});

  const { data, loading, error, refresh } = useCcusageData(
    () => fetchWeekly({ ...params, agent }),
    [agent, params.since, params.until, params.offline]
  );

  if (error) {
    return <Result status="error" title="周报数据加载失败" subTitle={error} />;
  }

  const weekly = data?.weekly || [];
  const totals = data?.totals || {};

  return (
    <Spin spinning={loading}>
      <DateRangeFilter params={params} onChange={setParams} onRefresh={refresh} loading={loading} />
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <SummaryCards totals={totals} />
        </Col>
        <Col xs={24} lg={14}>
          <TokenTrendChart data={weekly} />
        </Col>
        <Col xs={24} lg={10}>
          <CostTrendChart data={weekly} />
        </Col>
        <Col span={24}>
          <UsageTable data={weekly} periodLabel="周起始日" loading={loading} />
        </Col>
      </Row>
    </Spin>
  );
}
