"use client";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#0ea5e9", "#a855f7", "#64748b"];
const axis = { fontSize: 12, stroke: "#888" };

export function DailyBar({ data }: { data: { label: string; hours: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}><CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="label" tick={axis} interval="preserveStartEnd" /><YAxis tick={axis} unit="h" width={40} />
        <Tooltip formatter={(v) => [`${v} h`, "Study time"]} /><Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} /></BarChart>
    </ResponsiveContainer>
  );
}
export function SubjectDonut({ data }: { data: { name: string; hours: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart><Pie data={data} dataKey="hours" nameKey="name" innerRadius={55} outerRadius={90}>
        {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie>
        <Tooltip formatter={(v) => [`${v} h`, "Study time"]} /></PieChart>
    </ResponsiveContainer>
  );
}
export function TrendLine({ data }: { data: { label: string; tasks: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}><CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="label" tick={axis} interval="preserveStartEnd" /><YAxis tick={axis} allowDecimals={false} width={30} />
        <Tooltip formatter={(v) => [v, "Tasks completed"]} /><Line type="monotone" dataKey="tasks" stroke="#10b981" strokeWidth={2} dot={false} /></LineChart>
    </ResponsiveContainer>
  );
}
