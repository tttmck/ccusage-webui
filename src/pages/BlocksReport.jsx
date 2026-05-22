import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Tag, Badge, Statistic, Spin, Result, Switch, Space } from 'antd';
import useCcusageData from '../hooks/useCcusageData';
import { fetchBlocks } from '../api/ccusage';
import { useAgent } from '../contexts/AgentContext';
import DateRangeFilter from '../components/DateRangeFilter';
import SummaryCards from '../components/SummaryCards';
import { formatTokens, formatCost, formatDateTime, formatDuration } from '../utils/formatters';

function ActiveBlockCard({ block }) {
  if (!block) return null;

  const elapsed = formatDuration(block.startTime, block.actualEndTime || new Date().toISOString());

  return (
    <Card
      size="small"
      style={{ borderColor: '#52c41a', borderWidth: 2, marginBottom: 16 }}
      title={<span><Badge status="processing" /> 活跃计费块</span>}
    >
      <Row gutter={16}>
        <Col span={6}><Statistic title="开始时间" value={formatDateTime(block.startTime)} valueStyle={{ fontSize: 14 }} /></Col>
        <Col span={4}><Statistic title="已用时间" value={elapsed} valueStyle={{ fontSize: 14 }} /></Col>
        <Col span={4}><Statistic title="Token" value={formatTokens(block.totalTokens)} valueStyle={{ fontSize: 14 }} /></Col>
        <Col span={4}><Statistic title="费用" value={formatCost(block.costUSD)} valueStyle={{ fontSize: 14 }} /></Col>
        <Col span={6}>
          <Statistic title="模型" valueStyle={{ fontSize: 14 }}
            value={block.models?.join(', ') || '-'}
          />
        </Col>
      </Row>
      {block.projection && (
        <Row gutter={16} style={{ marginTop: 8 }}>
          <Col span={6}><Statistic title="预计总 Token" value={formatTokens(block.projection.projectedTotalTokens)} valueStyle={{ fontSize: 14, color: '#faad14' }} /></Col>
          <Col span={6}><Statistic title="预计总费用" value={formatCost(block.projection.projectedCost)} valueStyle={{ fontSize: 14, color: '#faad14' }} /></Col>
          <Col span={6}><Statistic title="剩余时间" value={block.projection.remainingMinutes ? `${block.projection.remainingMinutes} 分钟` : '-'} valueStyle={{ fontSize: 14, color: '#faad14' }} /></Col>
        </Row>
      )}
      {block.burnRate && (
        <Row gutter={16} style={{ marginTop: 8 }}>
          <Col span={6}><Statistic title="消耗率 (Token/分钟)" value={formatTokens(block.burnRate.tokensPerMinute)} valueStyle={{ fontSize: 14, color: '#cf1322' }} /></Col>
          <Col span={6}><Statistic title="消耗率 ($/小时)" value={formatCost(block.burnRate.costPerHour)} valueStyle={{ fontSize: 14, color: '#cf1322' }} /></Col>
        </Row>
      )}
    </Card>
  );
}

export default function BlocksReport() {
  const { agent } = useAgent();
  const [params, setParams] = useState({});
  const [hideGaps, setHideGaps] = useState(true);

  const { data, loading, error, refresh } = useCcusageData(
    () => fetchBlocks({ ...params, agent }),
    [agent, params.since, params.until, params.offline]
  );

  useEffect(() => {
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (error) {
    return <Result status="error" title="计费块数据加载失败" subTitle={error} />;
  }

  const allBlocks = data?.blocks || [];
  const activeBlock = allBlocks.find((b) => b.isActive);
  const blocks = hideGaps ? allBlocks.filter((b) => !b.isGap) : allBlocks;

  const totalTokens = blocks.reduce((sum, b) => sum + (b.totalTokens || 0), 0);
  const totalCost = blocks.reduce((sum, b) => sum + (b.costUSD || 0), 0);

  const columns = [
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 150,
      render: (v) => formatDateTime(v),
      sorter: (a, b) => a.startTime.localeCompare(b.startTime),
      defaultSortOrder: 'descend',
    },
    {
      title: '结束时间',
      dataIndex: 'actualEndTime',
      key: 'endTime',
      width: 150,
      render: (v, r) => v ? formatDateTime(v) : formatDateTime(r.endTime),
    },
    {
      title: '时长',
      key: 'duration',
      width: 80,
      render: (_, r) => formatDuration(r.startTime, r.actualEndTime || r.endTime),
    },
    {
      title: '状态',
      key: 'status',
      width: 80,
      render: (_, r) => {
        if (r.isActive) return <Badge status="processing" text="活跃" />;
        if (r.isGap) return <Badge status="default" text="间隔" />;
        return <Badge status="default" text="已结束" />;
      },
    },
    {
      title: '条目数',
      dataIndex: 'entries',
      key: 'entries',
      width: 70,
      align: 'right',
    },
    {
      title: '模型',
      dataIndex: 'models',
      key: 'models',
      width: 200,
      render: (models) => models?.map((m) => <Tag key={m}>{m}</Tag>),
    },
    {
      title: '输入',
      key: 'inputTokens',
      width: 90,
      align: 'right',
      render: (_, r) => formatTokens(r.tokenCounts?.inputTokens),
    },
    {
      title: '输出',
      key: 'outputTokens',
      width: 90,
      align: 'right',
      render: (_, r) => formatTokens(r.tokenCounts?.outputTokens),
    },
    {
      title: '总 Token',
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      width: 100,
      align: 'right',
      render: formatTokens,
      sorter: (a, b) => a.totalTokens - b.totalTokens,
    },
    {
      title: '费用',
      dataIndex: 'costUSD',
      key: 'costUSD',
      width: 80,
      align: 'right',
      render: formatCost,
      sorter: (a, b) => a.costUSD - b.costUSD,
    },
  ];

  return (
    <Spin spinning={loading}>
      <DateRangeFilter params={params} onChange={setParams} onRefresh={refresh} loading={loading} />
      <ActiveBlockCard block={activeBlock} />
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <SummaryCards totals={{ totalTokens, totalCost: totalCost, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 }}
            extraStats={[{
              title: '计费块总数',
              value: String(blocks.filter((b) => !b.isGap).length),
              color: '#1677ff',
            }]}
          />
        </Col>
      </Row>
      <Row style={{ marginBottom: 16 }}>
        <Space>
          <span>隐藏间隔:</span>
          <Switch size="small" checked={hideGaps} onChange={setHideGaps} />
        </Space>
      </Row>
      <Table
        dataSource={blocks}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        scroll={{ x: 1100 }}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 个计费块` }}
      />
    </Spin>
  );
}
