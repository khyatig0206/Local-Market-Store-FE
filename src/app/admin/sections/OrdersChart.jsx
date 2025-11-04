'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function OrdersChart({ data = [] }) {
  return (
    <div style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            labelStyle={{ color: '#111827', fontWeight: 700 }}
            itemStyle={{ color: '#111827' }}
          />
          <Bar dataKey="orders" fill="#16a34a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
