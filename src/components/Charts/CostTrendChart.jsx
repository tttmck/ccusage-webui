import { Card } from 'antd';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatCost } from '../../utils/formatters';

export default function CostTrendChart({ data }) {
  if (!data?.length) return null;

  let cumulative = 0;
  const chartData = data.map((d) => {
    cumulative += d.totalCost;
    return { ...d, cumulativeCost: Math.round(cumulative * 100) / 100 };
  });

  return (
    <Card title="费用趋势" size="small">
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
          <Tooltip formatter={(val) => formatCost(val)} />
          <Legend />
          <Bar yAxisId="left" dataKey="totalCost" name="期间费用" fill="#1677ff" fillOpacity={0.8} />
          <Line yAxisId="right" type="monotone" dataKey="cumulativeCost" name="累计费用" stroke="#cf1322" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}
