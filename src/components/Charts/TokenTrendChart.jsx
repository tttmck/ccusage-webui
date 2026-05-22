import { Card } from 'antd';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatTokens } from '../../utils/formatters';

const AREAS = [
  { key: 'inputTokens', name: '输入', color: '#1677ff' },
  { key: 'outputTokens', name: '输出', color: '#52c41a' },
  { key: 'cacheReadTokens', name: '缓存读取', color: '#fa8c16' },
  { key: 'cacheCreationTokens', name: '缓存创建', color: '#eb2f96' },
];

function formatYAxis(value) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(0)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value;
}

export default function TokenTrendChart({ data }) {
  if (!data?.length) return null;

  return (
    <Card title="Token 趋势" size="small">
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(val) => formatTokens(val)} />
          <Legend />
          {AREAS.map(({ key, name, color }) => (
            <Area key={key} type="monotone" dataKey={key} name={name} stroke={color} fill={color} fillOpacity={0.15} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
