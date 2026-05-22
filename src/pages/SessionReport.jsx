import { useState } from 'react';
import { Table, Tag, Spin, Result } from 'antd';
import useCcusageData from '../hooks/useCcusageData';
import { fetchSession } from '../api/ccusage';
import { useAgent } from '../contexts/AgentContext';
import DateRangeFilter from '../components/DateRangeFilter';
import { formatTokens, formatCost, formatDateTime } from '../utils/formatters';

const MODEL_COLORS = {
  'gpt-5.5': '#1677ff', 'gpt-5.4': '#52c41a', 'glm-5.1': '#722ed1',
  'glm-5-turbo': '#13c2c2', 'glm-4.7': '#fa8c16', 'claude-haiku-4-5-20251001': '#eb2f96',
};

function getModelColor(name) {
  for (const [key, color] of Object.entries(MODEL_COLORS)) {
    if (name.includes(key) || key.includes(name)) return color;
  }
  return '#666';
}

const breakdownColumns = [
  { title: '模型', dataIndex: 'modelName', key: 'modelName', render: (v) => <Tag color={getModelColor(v)}>{v}</Tag> },
  { title: '输入', dataIndex: 'inputTokens', key: 'inputTokens', render: formatTokens, align: 'right' },
  { title: '输出', dataIndex: 'outputTokens', key: 'outputTokens', render: formatTokens, align: 'right' },
  { title: '缓存读取', dataIndex: 'cacheReadTokens', key: 'cacheReadTokens', render: formatTokens, align: 'right' },
  { title: '费用', dataIndex: 'cost', key: 'cost', render: formatCost, align: 'right' },
];

export default function SessionReport() {
  const { agent } = useAgent();
  const [params, setParams] = useState({});

  const { data, loading, error, refresh } = useCcusageData(
    () => fetchSession({ ...params, agent }),
    [agent, params.since, params.until, params.offline]
  );

  if (error) {
    return <Result status="error" title="会话数据加载失败" subTitle={error} />;
  }

  const sessions = (data?.session || []).sort((a, b) => {
    const la = a.metadata?.lastActivity || '';
    const lb = b.metadata?.lastActivity || '';
    return lb.localeCompare(la);
  });

  const columns = [
    {
      title: '会话 ID',
      dataIndex: 'period',
      key: 'period',
      width: 160,
      render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v.slice(0, 8)}...</span>,
    },
    {
      title: '最后活动',
      key: 'lastActivity',
      width: 140,
      sorter: (a, b) => (a.metadata?.lastActivity || '').localeCompare(b.metadata?.lastActivity || ''),
      defaultSortOrder: 'descend',
      render: (_, r) => formatDateTime(r.metadata?.lastActivity),
    },
    {
      title: '工具',
      dataIndex: 'agent',
      key: 'agent',
      width: 100,
      render: (v) => v ? <Tag>{v}</Tag> : '-',
    },
    { title: '输入', dataIndex: 'inputTokens', key: 'inputTokens', render: formatTokens, align: 'right' },
    { title: '输出', dataIndex: 'outputTokens', key: 'outputTokens', render: formatTokens, align: 'right' },
    { title: '缓存读取', dataIndex: 'cacheReadTokens', key: 'cacheReadTokens', render: formatTokens, align: 'right' },
    { title: '总 Token', dataIndex: 'totalTokens', key: 'totalTokens', render: formatTokens, align: 'right' },
    { title: '费用', dataIndex: 'totalCost', key: 'totalCost', render: formatCost, align: 'right' },
    {
      title: '模型',
      dataIndex: 'modelsUsed',
      key: 'modelsUsed',
      width: 180,
      render: (models) => models?.map((m) => <Tag key={m} color={getModelColor(m)}>{m}</Tag>),
    },
  ];

  return (
    <Spin spinning={loading}>
      <DateRangeFilter params={params} onChange={setParams} onRefresh={refresh} loading={loading} />
      <Table
        dataSource={sessions}
        columns={columns}
        rowKey="period"
        loading={loading}
        size="small"
        scroll={{ x: 1000 }}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 个会话` }}
        expandable={{
          expandedRowRender: (record) =>
            record.modelBreakdowns?.length > 0 ? (
              <Table dataSource={record.modelBreakdowns} columns={breakdownColumns} rowKey="modelName" size="small" pagination={false} />
            ) : null,
          rowExpandable: (record) => record.modelBreakdowns?.length > 1,
        }}
      />
    </Spin>
  );
}
