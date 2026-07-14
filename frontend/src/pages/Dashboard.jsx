import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states for creating a new task
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // 1. Secure Route Guard & Fetch Tasks on Mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // If no token exists, immediately redirect to login page
      navigate('/login');
      return;
    }
    fetchTasks();
  }, [navigate]);

  // Helper to generate auth headers dynamically
  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // Helper to handle API and unauthorized (401) errors gracefully
  const handleApiError = (err, defaultMsg) => {
    console.error(err);
    if (err.response && err.response.status === 401) {
      // Token has expired or is invalid -> wipe local credentials and redirect
      localStorage.removeItem('token');
      navigate('/login');
    } else {
      setError(err.response?.data?.error || defaultMsg);
    }
  };

  // 2. READ: Get all tasks
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:5000/api/tasks', getHeaders());
      setTasks(response.data);
      setError('');
    } catch (err) {
      handleApiError(err, 'Failed to fetch tasks from server.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. CREATE: Add a new task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const response = await axios.post(
        'http://localhost:5000/api/tasks',
        { title, description },
        getHeaders()
      );
      // Update local array state with the new database entry
      setTasks([...tasks, response.data]);
      setTitle('');
      setDescription('');
      setIsCreating(false);
      setError('');
    } catch (err) {
      handleApiError(err, 'Could not create task. Please try again.');
    }
  };

  // 4. UPDATE: Transition status (To Do ⇄ In Progress ⇄ Done)
  const handleUpdateStatus = async (taskId, currentStatus, direction) => {
    const statuses = ['TODO', 'IN_PROGRESS', 'DONE'];
    const currentIndex = statuses.indexOf(currentStatus);
    
    let newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= statuses.length) return; // Boundary lock

    const newStatus = statuses[newIndex];

    try {
      const response = await axios.put(
        `http://localhost:5000/api/tasks/${taskId}`,
        { status: newStatus },
        getHeaders()
      );
      // Map across state to update visual position instantly
      setTasks(tasks.map(t => (t.id === taskId ? response.data : t)));
    } catch (err) {
      handleApiError(err, 'Failed to update task state.');
    }
  };

  // 5. DELETE: Remove task completely
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to permanently delete this task?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, getHeaders());
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      handleApiError(err, 'Failed to remove the task.');
    }
  };

  // 6. LOGOUT: Wipe security token and redirect
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Organize tasks by column criteria
  const getTasksByColumn = (columnStatus) => {
    return tasks.filter(task => task.status === columnStatus);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08),transparent_60%)] pointer-events-none" />
        <p className="animate-pulse text-sm tracking-widest uppercase relative z-10">Retrieving workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans antialiased relative overflow-x-hidden">
      {/* Background radial glow effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06),transparent_65%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Navigation Bar */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-slate-800/80">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Your Board</h1>
            <p className="text-sm text-slate-400">Track and progress tasks dynamically across your team</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition-colors shadow-sm shadow-indigo-900/30 cursor-pointer"
            >
              {isCreating ? 'Cancel' : '＋ New Issue'}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800 text-slate-300 font-medium text-sm rounded-lg transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Task Creator Form (Accordion Slide) */}
        {isCreating && (
          <form onSubmit={handleCreateTask} className="mb-8 p-6 bg-slate-800/40 border border-slate-800/80 backdrop-blur-md rounded-2xl max-w-xl shadow-2xl relative z-20">
            <h3 className="text-base font-bold mb-4 text-slate-100">Create a New Issue</h3>
            <div className="mb-4">
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-2">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Database replication strategy..."
                className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-800 text-slate-100 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm placeholder:text-slate-600"
              />
            </div>
            <div className="mb-4">
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-2">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Analyze master-slave synchronization latencies..."
                rows="3"
                className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-800 text-slate-100 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm placeholder:text-slate-600 resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Commit to Board
            </button>
          </form>
        )}

        {/* 3-Column Kanban Board Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: To Do */}
          <div className="bg-slate-800/20 border border-slate-800/60 backdrop-blur-md rounded-2xl p-5 flex flex-col h-[calc(100vh-220px)] min-h-[400px]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-slate-300">To Do</span>
              <span className="px-2.5 py-0.5 bg-slate-800 text-[10px] font-semibold text-slate-400 rounded-full border border-slate-700/50">
                {getTasksByColumn('TODO').length}
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1 pr-1 no-scrollbar">
              {getTasksByColumn('TODO').map(task => renderCard(task))}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="bg-slate-800/20 border border-slate-800/60 backdrop-blur-md rounded-2xl p-5 flex flex-col h-[calc(100vh-220px)] min-h-[400px]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-slate-300">In Progress</span>
              <span className="px-2.5 py-0.5 bg-slate-800 text-[10px] font-semibold text-slate-400 rounded-full border border-slate-700/50">
                {getTasksByColumn('IN_PROGRESS').length}
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1 pr-1 no-scrollbar">
              {getTasksByColumn('IN_PROGRESS').map(task => renderCard(task))}
            </div>
          </div>

          {/* Column 3: Done */}
          <div className="bg-slate-800/20 border border-slate-800/60 backdrop-blur-md rounded-2xl p-5 flex flex-col h-[calc(100vh-220px)] min-h-[400px]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-slate-300">Done</span>
              <span className="px-2.5 py-0.5 bg-slate-800 text-[10px] font-semibold text-slate-400 rounded-full border border-slate-700/50">
                {getTasksByColumn('DONE').length}
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1 pr-1 no-scrollbar">
              {getTasksByColumn('DONE').map(task => renderCard(task))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  // Card Rendering Helper Function
  function renderCard(task) {
    return (
      <div
        key={task.id}
        className="group relative p-4 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800/60 hover:border-indigo-500/50 rounded-xl transition-all shadow-md backdrop-blur-sm"
      >
        <div className="flex justify-between items-start gap-2 mb-2">
          <h4 className="text-sm font-semibold text-slate-100 line-clamp-2 leading-snug">{task.title}</h4>
          <button
            onClick={() => handleDeleteTask(task.id)}
            className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-xs cursor-pointer"
            title="Delete task"
          >
            🗑️
          </button>
        </div>
        {task.description && (
          <p className="text-xs text-slate-400 mb-4 line-clamp-3 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Mini Controls to Move Columns Inline */}
        <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-800/40 mt-4">
          {task.status !== 'TODO' && (
            <button
              onClick={() => handleUpdateStatus(task.id, task.status, -1)}
              className="p-1 px-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 rounded transition-colors cursor-pointer border border-slate-700/50"
              title="Move left"
            >
              ←
            </button>
          )}
          {task.status !== 'DONE' && (
            <button
              onClick={() => handleUpdateStatus(task.id, task.status, 1)}
              className="p-1 px-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 rounded transition-colors cursor-pointer border border-slate-700/50"
              title="Move right"
            >
              →
            </button>
          )}
        </div>
      </div>
    );
  }
}