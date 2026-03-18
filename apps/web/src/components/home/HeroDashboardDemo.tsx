'use client';

import { motion } from 'framer-motion';
import { CheckSquare, CheckCircle2 } from 'lucide-react';

// Mock Data for the Demo
const DEMO_ITEMS = [
    {
        id: '1',
        title: 'Project Kickoff & Requirements',
        status: 'DONE',
        assignee: 'Alex',
        assigneeColor: 'bg-blue-500',
        date: 'Oct 24, 09:00',
    },
    {
        id: '2',
        title: 'Database Schema Design',
        status: 'DONE',
        assignee: 'Sarah',
        assigneeColor: 'bg-emerald-500',
        date: 'Oct 24, 14:30',
        description: 'Define users, projects, and protocol tables with relations.'
    },
    {
        id: '3',
        title: 'API Implementation',
        status: 'IN_PROGRESS',
        assignee: 'Mike',
        assigneeColor: 'bg-amber-500',
        date: 'Today, 10:00',
        description: 'Implement FAST endpoint for protocol generation.'
    },
    {
        id: '4',
        title: 'Frontend Integration',
        status: 'OPEN',
        assignee: null,
        date: 'Tomorrow',
    },
    {
        id: '5',
        title: 'Final Deployment',
        status: 'LOCKED',
        assignee: null,
        date: 'Pending',
    }
];

export function HeroDashboardDemo() {
    return (
        <div className="w-full h-full bg-slate-50/50 p-0 overflow-hidden rounded-xl border border-slate-200 shadow-inner select-none cursor-default">
            {/* Timeline Container - Matching ProjectBoard.tsx layout */}
            <div className="relative w-full pb-8 pt-4 pl-32 md:pl-0">
                {/* Continuous Vertical Line */}
                <div className="absolute left-[39px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-indigo-200 via-slate-200 to-transparent -z-10 hidden md:block"></div>

                <div className="space-y-0">
                    {DEMO_ITEMS.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.15 + 0.5, duration: 0.5 }}
                            className="relative group md:pl-14 py-0.5"
                        >
                            {/* Timeline Dot & Date */}
                            <div className="absolute top-6 z-10 hidden md:flex items-center justify-center left-[34px]">
                                {/* The Dot Itself */}
                                <div className={`rounded-full border-2 border-white shadow-sm shrink-0 w-3 h-3
                                    ${item.status === 'DONE' ? 'bg-emerald-500 ring-2 ring-emerald-50' :
                                        item.status === 'IN_PROGRESS' ? 'bg-amber-500 ring-2 ring-amber-50' :
                                            item.status === 'LOCKED' ? 'bg-slate-300' : 'bg-indigo-500 ring-2 ring-indigo-50'}
                                `}></div>

                                {/* Left Side: Date */}
                                <div className="absolute top-1/2 -translate-y-1/2 flex items-center justify-end w-32 pr-2 right-5">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap leading-3">
                                            {item.date.split(',')[0]}
                                        </span>
                                        <span className="text-[9px] text-slate-400 leading-3">
                                            {item.date.split(',')[1] || ''}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Connection to Card */}
                            <div className="absolute top-[29px] h-px bg-slate-200 hidden md:block left-[38px] w-5 transition-colors group-hover:bg-indigo-300"></div>

                            {/* Card */}
                            <div className={`
                                w-full px-4 py-3 rounded-lg border transition-all duration-200 relative
                                ${item.status === 'LOCKED' ? 'bg-slate-50 border-slate-200/60 grayscale opacity-70' :
                                    'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200'}
                            `}>
                                <div className="flex flex-col md:flex-row gap-3 items-center">
                                    {/* LEFT: Status & Title */}
                                    <div className="flex items-center gap-3 w-full md:flex-1 min-w-0">
                                        {/* Status Pill */}
                                        <div className={`shrink-0 w-1.5 h-1.5 rounded-full ${item.status === 'DONE' ? 'bg-emerald-500' :
                                            item.status === 'IN_PROGRESS' ? 'bg-amber-500' :
                                                item.status === 'LOCKED' ? 'bg-slate-300' : 'bg-indigo-500'
                                            }`}></div>

                                        <div className="min-w-0 flex-1 relative">
                                            <div className="flex items-baseline gap-2">
                                                <h3 className={`text-sm font-semibold truncate flex items-center gap-1.5 ${item.status === 'LOCKED' ? 'text-slate-500' : 'text-slate-700'}`}>
                                                    {item.status === 'DONE' ? <CheckCircle2 size={14} className="text-indigo-500 shrink-0" /> :
                                                        <CheckSquare size={14} className="text-indigo-500 shrink-0" />}
                                                    {item.title}
                                                </h3>
                                            </div>

                                            <div className="text-[11px] text-slate-500 mt-0.5 min-h-[1.25rem] flex items-center gap-2">
                                                <span className="truncate">
                                                    {item.description || <span className="italic opacity-50">No details provided</span>}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT: Assignee & Actions */}
                                    <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-50">
                                        {item.assignee && (
                                            <div className={`w-6 h-6 rounded-full ${item.assigneeColor} flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-white shadow-sm`}>
                                                {item.assignee.charAt(0)}
                                            </div>
                                        )}

                                        {(item.status === 'IN_PROGRESS' || item.status === 'OPEN') && (
                                            <button className="h-7 px-3 rounded-md text-xs font-semibold bg-indigo-600 border border-indigo-600 text-white shadow-sm flex items-center gap-1.5 hover:bg-indigo-700">
                                                {item.status === 'IN_PROGRESS' ? (<span>✓ Done</span>) : 'Take'}
                                            </button>
                                        )}
                                        {item.status === 'DONE' && (
                                            <button className="h-7 px-3 rounded-md text-xs font-semibold bg-white border border-slate-200 text-slate-500 shadow-sm flex items-center gap-1.5 hover:bg-slate-50">
                                                <span>✓</span> Done
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
