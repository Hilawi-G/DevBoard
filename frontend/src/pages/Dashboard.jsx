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
      const response = await axios.get('http://127.0.0.1:5000/api/tasks', getHeaders());
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
        'http://127.0.0.1:5000/api/tasks',
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
        `http://127.0.0.1:5000/api/tasks/${taskId}`,
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
      await axios.delete(`http://127.0.0.1:5000/api/tasks/${taskId}`, getHeaders());
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
      <div className="min-h-screen flex items-center justify-center bg-[#0C0D0E] text-neutral-400">
        <p className="animate-pulse text-sm tracking-widest uppercase">Retrieving workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0C0D0E] text-neutral-100 p-8 font-sans antialiased">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation Bar */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-neutral-800">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your Board</h1>
            <p className="text-sm text-neutral-500">Track and progress tasks dynamically across your team</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition-colors shadow-sm shadow-indigo-900/30"
            >
              {isCreating ? 'Cancel' : '＋ New Issue'}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-medium text-sm rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-900 text-red-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Task Creator Form (Accordion Slide) */}
        {isCreating && (
          <form onSubmit={handleCreateTask} className="mb-8 p-6 bg-[#121314] border border-neutral-800 rounded-xl max-w-xl shadow-md">
            <h3 className="text-base font-semibold mb-4 text-neutral-200">Create a New Issue</h3>
            <div className="mb-4">
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-neutral-500 mb-2">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Database replication strategy..."
                className="w-full bg-[#18191B] border border-neutral-800 rounded-lg p-3 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="mb-4">
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-neutral-500 mb-2">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Analyze master-slave synchronization latencies..."
                rows="3"
                className="w-full bg-[#18191B] border border-neutral-800 rounded-lg p-3 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-all"
            >
              Commit to Board
            </button>
          </form>
        )}

        {/* 3-Column Kanban Board Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: To Do */}
          <div className="bg-[#121314]/40 border border-neutral-900 rounded-xl p-5 flex flex-col h-[calc(100vh-220px)] min-h-[400px]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-neutral-300">To Do</span>
              <span className="px-2.5 py-0.5 bg-neutral-800 text-[10px] font-semibold text-neutral-400 rounded-full">
                {getTasksByColumn('TODO').length}
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {getTasksByColumn('TODO').map(task => renderCard(task))}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="bg-[#121314]/40 border border-neutral-900 rounded-xl p-5 flex flex-col h-[calc(100vh-220px)] min-h-[400px]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-neutral-300">In Progress</span>
              <span className="px-2.5 py-0.5 bg-neutral-800 text-[10px] font-semibold text-neutral-400 rounded-full">
                {getTasksByColumn('IN_PROGRESS').length}
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {getTasksByColumn('IN_PROGRESS').map(task => renderCard(task))}
            </div>
          </div>

          {/* Column 3: Done */}
          <div className="bg-[#121314]/40 border border-neutral-900 rounded-xl p-5 flex flex-col h-[calc(100vh-220px)] min-h-[400px]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-neutral-300">Done</span>
              <span className="px-2.5 py-0.5 bg-neutral-800 text-[10px] font-semibold text-neutral-400 rounded-full">
                {getTasksByColumn('DONE').length}
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
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
        className="group relative p-4 bg-[#121314] hover:bg-[#161719] border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all shadow-sm"
      >
        <div className="flex justify-between items-start gap-2 mb-2">
          <h4 className="text-sm font-medium text-neutral-200 line-clamp-2 leading-snug">{task.title}</h4>
          <button
            onClick={() => handleDeleteTask(task.id)}
            className="text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-xs"
            title="Delete task"
          >
            🗑️
          </button>
        </div>
        {task.description && (
          <p className="text-xs text-neutral-500 mb-4 line-clamp-3 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Mini Controls to Move Columns Inline */}
        <div className="flex justify-end gap-1.5 pt-2 border-t border-neutral-800/60 mt-4">
          {task.status !== 'TODO' && (
            <button
              onClick={() => handleUpdateStatus(task.id, task.status, -1)}
              className="p-1 px-2 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded transition-colors"
              title="Move left"
            >
              ←
            </button>
          )}
          {task.status !== 'DONE' && (
            <button
              onClick={() => handleUpdateStatus(task.id, task.status, 1)}
              className="p-1 px-2 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded transition-colors"
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