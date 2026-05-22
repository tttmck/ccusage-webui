import { Table, Tag } from 'antd';
import { formatTokens, formatCost } from '../utils/formatters';

const MODEL_COLORS = {
  'gpt-5.5': '#1677ff',
  'gpt-5.4': '#52c41a',
  'glm-5.1': '#722ed1',
  'glm-5-turbo': '#13c2c2',
  'glm-4.7': '#fa8c16',
  'claude-haiku-4-5-20251001': '#eb2f96',
  'deepseek-v4-flash-free': '#2f54eb',
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
  { title: '缓存创建', dataIndex: 'cacheCreationTokens', key: 'cacheCreationTokens', render: formatTokens, align: 'right' },
  { title: '费用', dataIndex: 'cost', key: 'cost', render: formatCost, align: 'right' },
];

export default function UsageTable({ data, periodLabel = '日期', loading = false }) {
  const columns = [
    {
      title: periodLabel,
      dataIndex: 'period',
      key: 'period',
      width: 120,
      sorter: (a, b) => a.period.localeCompare(b.period),
      defaultSortOrder: 'descend',
    },
    {
      title: '输入 Token',
      dataIndex: 'inputTokens',
      key: 'inputTokens',
      render: formatTokens,
      align: 'right',
      sorter: (a, b) => a.inputTokens - b.inputTokens,
    },
    {
      title: '输出 Token',
      dataIndex: 'outputTokens',
      key: 'outputTokens',
      render: formatTokens,
      align: 'right',
      sorter: (a, b) => a.outputTokens - b.outputTokens,
    },
    {
      title: '缓存读取',
      dataIndex: 'cacheReadTokens',
      key: 'cacheReadTokens',
      render: formatTokens,
      align: 'right',
      sorter: (a, b) => a.cacheReadTokens - b.cacheReadTokens,
    },
    {
      title: '缓存创建',
      dataIndex: 'cacheCreationTokens',
      key: 'cacheCreationTokens',
      render: formatTokens,
      align: 'right',
      sorter: (a, b) => a.cacheCreationTokens - b.cacheCreationTokens,
    },
    {
      title: '总 Token',
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      render: formatTokens,
      align: 'right',
      sorter: (a, b) => a.totalTokens - b.totalTokens,
    },
    {
      title: '费用',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: formatCost,
      align: 'right',
      sorter: (a, b) => a.totalCost - b.totalCost,
    },
    {
      title: '模型',
      dataIndex: 'modelsUsed',
      key: 'modelsUsed',
      render: (models) => models?.map((m) => <Tag key={m} color={getModelColor(m)}>{m}</Tag>),
      width: 200,
    },
  ];

  return (
    <Table
      dataSource={data || []}
      columns={columns}
      rowKey="period"
      loading={loading}
      size="small"
      scroll={{ x: 900 }}
      pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
      expandable={{
        expandedRowRender: (record) =>
          record.modelBreakdowns?.length > 0 ? (
            <Table
              dataSource={record.modelBreakdowns}
              columns={breakdownColumns}
              rowKey="modelName"
              size="small"
              pagination={false}
            />
          ) : null,
        rowExpandable: (record) => record.modelBreakdowns?.length > 1,
      }}
    />
  );
}
