import { Card } from 'antd';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCost } from '../../utils/formatters';

const COLORS = ['#1677ff', '#52c41a', '#722ed1', '#fa8c16', '#13c2c2', '#eb2f96', '#2f54eb', '#a0d911'];

function aggregateByModel(data) {
  const map = {};
  for (const entry of data) {
    for (const b of entry.modelBreakdowns || []) {
      if (!map[b.modelName]) map[b.modelName] = { name: b.modelName, cost: 0 };
      map[b.modelName].cost += b.cost;
    }
  }
  return Object.values(map).sort((a, b) => b.cost - a.cost);
}

export default function ModelPieChart({ data }) {
  if (!data?.length) return null;

  const chartData = aggregateByModel(data);

  return (
    <Card title="模型费用分布" size="small">
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="cost"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={120}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            labelLine
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(val) => formatCost(val)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
