import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Pencil, Trash2, GripVertical, Search, CalendarDays, Flag } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ThemeToggle from '../components/ThemeToggle';

// --- Priority Config ---
const PRIORITIES = ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const PRIORITY_STYLES = {
  NONE:     { badge: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400', dot: 'bg-slate-400' },
  LOW:      { badge: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400',       dot: 'bg-sky-400' },
  MEDIUM:   { badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400', dot: 'bg-amber-400' },
  HIGH:     { badge: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400',   dot: 'bg-rose-500' },
  CRITICAL: { badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400', dot: 'bg-purple-600' },
};

function PriorityBadge({ priority }) {
  if (!priority || priority === 'NONE') return null;
  const styles = PRIORITY_STYLES[priority] || PRIORITY_STYLES.NONE;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${styles.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></span>
      {priority}
    </span>
  );
}

function DueDatePill({ dueDate }) {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = date < today;
  const formatted = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
      isOverdue
        ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
        : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
    }`}>
      <CalendarDays className="w-2.5 h-2.5" />
      {formatted}
    </span>
  );
}

const INPUT_CLASS = 'w-full px-4 py-2.5 bg-slate-50 dark:bg-gunmetal border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-dusty-denim focus:ring-1 focus:ring-dusty-denim/30 transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-400';
const LABEL_CLASS = 'block text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-2';

export default function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Create form
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('NONE');
  const [dueDate, setDueDate] = useState('');

  // Edit form
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('NONE');
  const [editDueDate, setEditDueDate] = useState('');

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchTasks();
  }, [navigate]);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const handleApiError = (err, defaultMsg) => {
    console.error(err);
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('token');
      navigate('/login');
    } else {
      setError(err.response?.data?.error || defaultMsg);
    }
  };

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:5000/api/tasks', getHeaders());
      setTasks(response.data.sort((a, b) => a.id - b.id));
      setError('');
    } catch (err) {
      handleApiError(err, 'Failed to fetch tasks from server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const response = await axios.post(
        'http://localhost:5000/api/tasks',
        { title, description, priority, dueDate: dueDate || null },
        getHeaders()
      );
      setTasks([...tasks, response.data]);
      setTitle(''); setDescription(''); setPriority('NONE'); setDueDate('');
      setIsCreating(false); setError('');
    } catch (err) {
      handleApiError(err, 'Could not create task. Please try again.');
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const taskId = parseInt(draggableId, 10);
    const newStatus = destination.droppableId;
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    if (source.droppableId !== destination.droppableId) {
      try {
        await axios.put(`http://localhost:5000/api/tasks/${taskId}`, { status: newStatus }, getHeaders());
      } catch (err) {
        handleApiError(err, 'Failed to update task state.');
        fetchTasks();
      }
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to permanently delete this task?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, getHeaders());
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      handleApiError(err, 'Failed to remove the task.');
    }
  };

  const startEditing = (task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditPriority(task.priority || 'NONE');
    setEditDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    try {
      const response = await axios.put(
        `http://localhost:5000/api/tasks/${editingTask.id}`,
        { title: editTitle, description: editDescription, priority: editPriority, dueDate: editDueDate || null },
        getHeaders()
      );
      setTasks(tasks.map(t => t.id === editingTask.id ? response.data : t));
      setEditingTask(null);
      setError('');
    } catch (err) {
      handleApiError(err, 'Failed to update the task.');
    }
  };

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };

  // Filtered + searched tasks per column
  const getTasksByColumn = useMemo(() => (columnStatus) => {
    return tasks.filter(task => {
      if (task.status !== columnStatus) return false;
      if (activeFilter !== 'ALL' && task.priority !== activeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return task.title.toLowerCase().includes(q) || (task.description || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [tasks, activeFilter, searchQuery]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gunmetal text-slate-500 dark:text-slate-400 transition-colors">
        <p className="animate-pulse text-sm tracking-widest uppercase font-bold">Retrieving workspace...</p>
      </div>
    );
  }

  const filterPills = ['ALL', ...PRIORITIES.filter(p => p !== 'NONE')];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gunmetal text-slate-900 dark:text-white p-4 sm:p-8 font-sans antialiased overflow-x-hidden transition-colors">
      <div className="max-w-7xl mx-auto">

        {/* Navigation Bar */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-600 transition-colors">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Your Board</h1>
            <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">Track and progress tasks dynamically across your team</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="flex-1 sm:flex-none px-4 py-2 bg-dusty-denim hover:bg-ocean-mist text-white font-medium text-sm rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              {isCreating ? 'Cancel' : '＋ New Issue'}
            </button>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-600/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 font-medium text-sm rounded-lg transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-dusty-denim focus:ring-1 focus:ring-dusty-denim/30 transition-all text-sm placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {filterPills.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
                  activeFilter === f
                    ? 'bg-dusty-denim text-white shadow'
                    : 'bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-dusty-denim'
                }`}
              >
                {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Task Creator Form */}
        {isCreating && (
          <form onSubmit={handleCreateTask} className="mb-8 p-6 bg-white/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-xl shadow-lg transition-colors">
            <h3 className="text-base font-bold mb-4">Create a New Issue</h3>
            <div className="mb-4">
              <label className={LABEL_CLASS}>Title</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Database replication strategy..." className={INPUT_CLASS} />
            </div>
            <div className="mb-4">
              <label className={LABEL_CLASS}>Description (Optional)</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the task..." rows="3" className={`${INPUT_CLASS} resize-none`} />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={LABEL_CLASS}><Flag className="inline w-3 h-3 mr-1" />Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className={INPUT_CLASS}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}><CalendarDays className="inline w-3 h-3 mr-1" />Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={INPUT_CLASS} />
              </div>
            </div>
            <button type="submit" className="w-full py-2.5 bg-dusty-denim hover:bg-ocean-mist text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer">
              Commit to Board
            </button>
          </form>
        )}

        {/* 3-Column Kanban Board */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Column 1: To Do */}
            <Droppable droppableId="TODO">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`border rounded-2xl p-5 flex flex-col h-[calc(100vh-280px)] min-h-[400px] transition-colors ${
                    snapshot.isDraggingOver
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                      : 'bg-blue-50/70 dark:bg-blue-900/10 border-blue-200/60 dark:border-blue-800/40'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-blue-900 dark:text-blue-300">To Do</span>
                    <span className="px-2.5 py-0.5 bg-white dark:bg-blue-950/50 text-[10px] font-bold text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800/50 shadow-sm">
                      {getTasksByColumn('TODO').length}
                    </span>
                  </div>
                  <div className="space-y-3 overflow-y-auto flex-1 pr-1 no-scrollbar">
                    {getTasksByColumn('TODO').map((task, index) => renderCard(task, index))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>

            {/* Column 2: In Progress */}
            <Droppable droppableId="IN_PROGRESS">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`border rounded-2xl p-5 flex flex-col h-[calc(100vh-280px)] min-h-[400px] transition-colors ${
                    snapshot.isDraggingOver
                      ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700'
                      : 'bg-amber-50/70 dark:bg-amber-900/10 border-amber-200/60 dark:border-amber-800/40'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-amber-900 dark:text-amber-300">In Progress</span>
                    <span className="px-2.5 py-0.5 bg-white dark:bg-amber-950/50 text-[10px] font-bold text-amber-600 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800/50 shadow-sm">
                      {getTasksByColumn('IN_PROGRESS').length}
                    </span>
                  </div>
                  <div className="space-y-3 overflow-y-auto flex-1 pr-1 no-scrollbar">
                    {getTasksByColumn('IN_PROGRESS').map((task, index) => renderCard(task, index))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>

            {/* Column 3: Done */}
            <Droppable droppableId="DONE">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`border rounded-2xl p-5 flex flex-col h-[calc(100vh-280px)] min-h-[400px] transition-colors ${
                    snapshot.isDraggingOver
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700'
                      : 'bg-emerald-50/70 dark:bg-emerald-900/10 border-emerald-200/60 dark:border-emerald-800/40'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-emerald-900 dark:text-emerald-300">Done</span>
                    <span className="px-2.5 py-0.5 bg-white dark:bg-emerald-950/50 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                      {getTasksByColumn('DONE').length}
                    </span>
                  </div>
                  <div className="space-y-3 overflow-y-auto flex-1 pr-1 no-scrollbar">
                    {getTasksByColumn('DONE').map((task, index) => renderCard(task, index))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>

          </div>
        </DragDropContext>
      </div>

      {/* Task Editor Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-gunmetal/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl p-6 shadow-2xl transition-colors">
            <h3 className="text-lg font-bold mb-4">Edit Task</h3>
            <form onSubmit={handleEditTask} className="space-y-4">
              <div>
                <label className={LABEL_CLASS}>Title</label>
                <input type="text" required value={editTitle} onChange={e => setEditTitle(e.target.value)} className={INPUT_CLASS} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Description (Optional)</label>
                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows="3" className={`${INPUT_CLASS} resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}><Flag className="inline w-3 h-3 mr-1" />Priority</label>
                  <select value={editPriority} onChange={e => setEditPriority(e.target.value)} className={INPUT_CLASS}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS}><CalendarDays className="inline w-3 h-3 mr-1" />Due Date</label>
                  <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} className={INPUT_CLASS} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditingTask(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-600/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 text-sm font-semibold rounded-lg transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-dusty-denim hover:bg-ocean-mist text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  function renderCard(task, index) {
    return (
      <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`group relative p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl transition-shadow shadow-sm hover:border-dusty-denim/50 dark:hover:border-dusty-denim/50 ${
              snapshot.isDragging ? 'shadow-xl ring-2 ring-dusty-denim/50 scale-105 opacity-90 z-50' : ''
            }`}
          >
            {/* Card Header */}
            <div className="flex justify-between items-start gap-2 mb-2">
              <div className="flex gap-2 items-start flex-1">
                <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-500 mt-0.5 cursor-grab active:cursor-grabbing flex-shrink-0" />
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">{task.title}</h4>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => startEditing(task)} className="text-slate-400 hover:text-dusty-denim opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer" title="Edit task">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDeleteTask(task.id)} className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer" title="Delete task">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-xs text-slate-500 dark:text-slate-300 mb-3 line-clamp-2 leading-relaxed pl-6">
                {task.description}
              </p>
            )}

            {/* Priority & Due Date Badges */}
            {(task.priority !== 'NONE' || task.dueDate) && (
              <div className="flex flex-wrap gap-1.5 pl-6 pt-1">
                <PriorityBadge priority={task.priority} />
                <DueDatePill dueDate={task.dueDate} />
              </div>
            )}
          </div>
        )}
      </Draggable>
    );
  }
}