import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { logout, user } = useAuth();

  // Mock data representing incoming tasks from your Neon Postgres database
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Configure PostgreSQL Connection', description: 'Link Express API layer to Neon cloud cluster using connection pooling strings.', status: 'TODO' },
    { id: 2, title: 'Verify Authentication JWT Lifecycle', description: 'Validate stateless pass generation on registration and gateway login routes.', status: 'IN_PROGRESS' },
    { id: 3, title: 'Initialize Vite App Framework', description: 'Scaffold frontend client directory structure and link Tailwind CSS build configurations.', status: 'DONE' },
  ]);

  // Column definitions acting as master layout filters
  const columns = [
    { id: 'TODO', title: 'To Do', accent: 'bg-indigo-500' },
    { id: 'IN_PROGRESS', title: 'In Progress', accent: 'bg-amber-500' },
    { id: 'DONE', title: 'Done', accent: 'bg-emerald-500' },
  ];

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-100 font-sans overflow-hidden">
      
      {/* 1. Global Navigation Top Bar */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold tracking-wider shadow-md shadow-indigo-600/20">
            D
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-100">DevBoard</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400 font-medium">Logged in as</p>
            <p className="text-sm text-indigo-400 font-semibold truncate max-w-[180px]">
              {user?.email || 'Developer'}
            </p>
          </div>
          <button
            onClick={logout}
            className="px-3 py-1.5 border border-slate-800 bg-slate-950/40 hover:bg-rose-950/20 hover:border-rose-900/50 text-slate-400 hover:text-rose-400 font-medium rounded-lg text-xs transition-all duration-200 cursor-pointer"
          >
            Log out
          </button>
        </div>
      </header>

      {/* 2. Main Kanban Board Workspace */}
      <main className="flex-1 p-6 md:p-8 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.03),transparent_45%)] pointer-events-none" />

        {/* 3-Column Responsive Grid Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
          {columns.map((column) => {
            // Filter global task array dynamically into corresponding status buckets
            const filteredTasks = tasks.filter(task => task.status === column.id);

            return (
              <div 
                key={column.id} 
                className="flex flex-col h-full max-h-[calc(100vh-140px)] bg-slate-950/20 border border-slate-800/60 rounded-xl p-4 backdrop-blur-sm"
              >
                {/* Column Header Metadata */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/40">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${column.accent}`} />
                    <h3 className="font-semibold text-sm text-slate-200">{column.title}</h3>
                    <span className="px-1.5 py-0.5 bg-slate-800/80 text-slate-400 font-mono text-2xs rounded-md">
                      {filteredTasks.length}
                    </span>
                  </div>
                  
                  {/* Inline Action Indicator (Linear Design Pattern) */}
                  <button className="text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer text-sm font-medium p-1 rounded hover:bg-slate-800/40">
                    ＋
                  </button>
                </div>

                {/* Task Item Scrollable Container Wrapper */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {filteredTasks.length === 0 ? (
                    <div className="h-24 border border-dashed border-slate-800/40 rounded-lg flex items-center justify-center text-xs text-slate-600">
                      No active entries
                    </div>
                  ) : (
                    filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 bg-slate-800/30 border border-slate-800/80 rounded-xl shadow-sm hover:border-slate-700 hover:bg-slate-800/50 transition-all duration-200 group cursor-grab active:cursor-grabbing"
                      >
                        <h4 className="font-medium text-sm text-slate-200 group-hover:text-indigo-400 transition-colors mb-1.5">
                          {task.title}
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                          {task.description}
                        </p>
                      </div>
                    ))
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </main>

    </div>
  );
}