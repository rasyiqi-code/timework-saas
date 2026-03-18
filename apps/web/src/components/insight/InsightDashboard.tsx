'use client';

import { InsightData } from '@/actions/insight';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, LayoutGrid, CheckCircle2, Zap, Clock, TrendingUp, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
    'ACTIVE': '#10b981', // Emerald
    'COMPLETED': '#3b82f6', // Blue
    'LOCKED': '#ef4444', // Red
    'IN_PROGRESS': '#f59e0b', // Amber
};

interface InsightDashboardProps {
    data: InsightData;
}

export function InsightDashboard({ data }: InsightDashboardProps) {

    // Prepare data for PieChart
    const statusData = data.projectsByStatus.map(s => ({
        name: s.status,
        value: s.count
    }));

    return (
        <div className="space-y-4 animate-in fade-in duration-500 pb-10">
            
            {/* KPI STRIP - Ultra High Density */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricCard 
                    label="Active Projects" 
                    value={data.totalProjects} 
                    icon={<Activity size={14} className="text-emerald-500" />}
                    trend="+2 this week"
                />
                <MetricCard 
                    label="Total Progress" 
                    value={data.totalTasks} 
                    icon={<CheckCircle2 size={14} className="text-blue-500" />}
                    sub="Completed tasks"
                />
                <MetricCard 
                    label="Completion Velocity" 
                    value={`${data.completionVelocity.toFixed(1)}d`} 
                    icon={<Zap size={14} className="text-amber-500" />}
                    sub="Avg. Project Lead Time"
                />
                <MetricCard 
                    label="Auto-Pilot ROI" 
                    value={`$${(data.estimatedSavings/1000).toFixed(1)}k`} 
                    icon={<TrendingUp size={14} className="text-indigo-500" />}
                    sub="Estimated resources saved"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* LEFT: Project Health Pulse (The Grid) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <LayoutGrid size={16} className="text-slate-400" />
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">Project Pulse</h3>
                        </div>
                        <span className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold">24 RECENT</span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                        {data.activeProjects.map((p) => (
                            <Link key={p.id} href={`/projects/${p.id}`} className="group relative">
                                <div className="aspect-square rounded-lg border border-slate-100 dark:border-slate-800 p-1 flex flex-col items-center justify-center hover:border-indigo-500 hover:shadow-md transition-all">
                                    {/* Progress Ring / Circle */}
                                    <div className="relative w-8 h-8 flex items-center justify-center mb-1">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="16" cy="16" r="14" fill="transparent" stroke="currentColor" strokeWidth="2.5" className="text-slate-100 dark:text-slate-800" />
                                            <circle cx="16" cy="16" r="14" fill="transparent" stroke="currentColor" strokeWidth="2.5" strokeDasharray={88} strokeDashoffset={88 - (88 * p.progress) / 100} className={p.progress > 90 ? 'text-emerald-500' : p.progress > 50 ? 'text-blue-500' : 'text-amber-500'} strokeLinecap="round" />
                                        </svg>
                                        <span className="absolute text-[8px] font-bold text-slate-500">{Math.round(p.progress)}%</span>
                                    </div>
                                    <span className="text-[8px] font-bold text-slate-400 truncate w-full text-center uppercase tracking-tighter px-0.5">{p.title}</span>
                                </div>
                                {/* Tooltip on hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 hidden group-hover:block bg-slate-900 text-white text-[9px] p-2 rounded shadow-xl z-50 pointer-events-none">
                                    <div className="font-bold border-b border-slate-700 pb-1 mb-1">{p.title}</div>
                                    <div className="flex justify-between">
                                        <span>Progress:</span>
                                        <span className="font-bold">{Math.round(p.progress)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Updated:</span>
                                        <span>{new Date(p.lastUpdate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Distribution Pie */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4 h-full">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight mb-4 text-center">Lifecycle Stage</h3>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%" cy="50%"
                                    innerRadius={50} outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#64748b'} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {statusData.map(s => (
                            <div key={s.name} className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 dark:bg-slate-800/50">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.name] || '#64748b' }} />
                                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate uppercase">{s.name}: {s.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* Team Density List */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 uppercase tracking-tight">
                            <Users size={14} className="text-slate-400" />
                            Team Load Density
                        </h3>
                        <span className="text-[9px] font-bold text-slate-400">SORT BY: PERFORMANCE</span>
                    </div>
                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        {data.assigneeStats.slice(0, 8).map((stat) => (
                            <div key={stat.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                                        {stat.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{stat.name}</div>
                                        <div className="text-[9px] text-slate-400 uppercase tracking-wider">{stat.completedTasks} units completed</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 text-right shrink-0">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-900 dark:text-white leading-none">{stat.activeTasks}</span>
                                        <span className="text-[8px] text-slate-400 uppercase">Load</span>
                                    </div>
                                    <div className="w-24">
                                        {stat.isBottleneck ? (
                                            <div className="flex items-center gap-1.5 text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">
                                                <AlertCircle size={10} strokeWidth={3} />
                                                <span className="text-[9px] font-black uppercase">Blocked</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[9px] font-black uppercase">Fluid</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Protocol Utilization */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">Protocol Efficiency</h3>
                        <Clock size={16} className="text-slate-300" />
                    </div>
                    <div className="flex-1 h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.protocolStats} layout="vertical" margin={{ left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} width={80} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ fontSize: '10px', borderRadius: '8px', border: 'none' }} />
                                <Bar dataKey="count" fill="#cd1717" radius={[0, 4, 4, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, icon, sub, trend }: { label: string, value: string | number, icon: React.ReactNode, sub?: string, trend?: string }) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm hover:border-indigo-200 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                <div className="p-1 rounded bg-slate-50 dark:bg-slate-800">{icon}</div>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-slate-800 dark:text-white">{value}</span>
                {trend && <span className="text-[8px] font-bold text-emerald-500">{trend}</span>}
                {sub && <span className="text-[9px] text-slate-400 font-medium truncate">{sub}</span>}
            </div>
        </div>
    );
}
