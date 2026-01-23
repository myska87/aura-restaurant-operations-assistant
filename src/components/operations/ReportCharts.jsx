import React from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const CheckInCompletionChart = ({ checkIns = [] }) => {
  if (!checkIns || checkIns.length === 0) return null;

  const byDay = {};
  checkIns.forEach(c => {
    const day = c.shift_date;
    if (!byDay[day]) byDay[day] = { completed: 0, total: 0 };
    byDay[day].total += 1;
    if (c.status === 'completed' || c.status === 'checked_out') byDay[day].completed += 1;
  });

  const data = Object.entries(byDay).map(([date, counts]) => ({
    date: date.slice(5),
    completed: counts.completed,
    pending: counts.total - counts.completed,
    total: counts.total
  }));

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">📊 Check-In Completion by Day</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed" />
            <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const TemperatureComplianceChart = ({ temperatures = [] }) => {
  if (!temperatures || temperatures.length === 0) return null;

  const compliant = temperatures.filter(t => t.is_in_range).length;
  const nonCompliant = temperatures.length - compliant;

  const data = [
    { name: 'Compliant', value: compliant, fill: '#10b981' },
    { name: 'Out of Range', value: nonCompliant, fill: '#ef4444' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">🌡️ Temperature Compliance Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const IssuesTrendChart = ({ issues = [] }) => {
  if (!issues || issues.length === 0) return null;

  const byDay = {};
  issues.forEach(i => {
    const date = i.created_date ? i.created_date.split('T')[0] : i.date;
    if (!byDay[date]) byDay[date] = 0;
    byDay[date] += 1;
  });

  const data = Object.entries(byDay).map(([date, count]) => ({
    date: date.slice(5),
    issues: count
  })).sort();

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">📈 Issues Logged Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="issues" stroke="#ef4444" strokeWidth={2} name="Issues" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const EquipmentActivityChart = ({ temperatures = [] }) => {
  if (!temperatures || temperatures.length === 0) return null;

  const byEquipment = {};
  temperatures.forEach(t => {
    const equipment = t.equipment_name;
    byEquipment[equipment] = (byEquipment[equipment] || 0) + 1;
  });

  const data = Object.entries(byEquipment)
    .map(([name, count]) => ({ name, readings: count }))
    .sort((a, b) => b.readings - a.readings)
    .slice(0, 8);

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">🧊 Equipment Activity Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={100} fontSize={12} />
            <Tooltip />
            <Bar dataKey="readings" fill="#3b82f6" name="Temperature Logs" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};