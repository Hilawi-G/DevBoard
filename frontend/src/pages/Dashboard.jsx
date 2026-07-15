import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Pencil, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ThemeToggle from '../components/ThemeToggle';

export default function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states for creating a new task
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Form states for editing an existing task
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // 1. Secure Route Guard & Fetch Tasks on Mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
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

  // 2. READ: Get all tasks
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:5000/api/tasks', getHeaders());
      // Sort tasks safely by id so they don't randomly shuffle (unless you implement full reordering logic)
      const sorted = response.data.sort((a, b) => a.id - b.id);
      setTasks(sorted);
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
      setTasks([...tasks, response.data]);
      setTitle('');
      setDescription('');
      setIsCreating(false);
      setError('');
    } catch (err) {
      handleApiError(err, 'Could not create task. Please try again.');
    }
  };

  // 4. UPDATE STATUS VIA DRAG & DROP
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Optimistically update the state
    const taskId = parseInt(draggableId, 10);
    const newStatus = destination.droppableId;
    
    // Create new array with updated status
    const newTasks = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, status: newStatus };
      }
      return t;
    });

    setTasks(newTasks);

    // Call API to persist
    if (source.droppableId !== destination.droppableId) {
      try {
        await axios.put(
          `http://localhost:5000/api/tasks/${taskId}`,
          { status: newStatus },
          getHeaders()
        );
      } catch (err) {
        handleApiError(err, 'Failed to update task state.');
        // Revert on failure
        fetchTasks();
      }
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

  // 5b. EDIT: Trigger editing modal and save changes
  const startEditing = (task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    try {
      const response = await axios.put(
        `http://localhost:5000/api/tasks/${editingTask.id}`,
        { title: editTitle, description: editDescription },
        getHeaders()
      );
      setTasks(tasks.map(t => (t.id === editingTask.id ? response.data : t)));
      setEditingTask(null);
      setEditTitle('');
      setEditDescription('');
      setError('');
    } catch (err) {
      handleApiError(err, 'Failed to update the task.');
    }
  };

  // 6. LOGOUT: Wipe security token and redirect
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getTasksByColumn = (columnStatus) => {
    return tasks.filter(task => task.status === columnStatus);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gunmetal text-slate-500 dark:text-slate-400 relative transition-colors">
        <p className="animate-pulse text-sm tracking-widest uppercase relative z-10 font-bold">Retrieving workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gunmetal text-slate-900 dark:text-white p-4 sm:p-8 font-sans antialiased relative overflow-x-hidden transition-colors">
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Navigation Bar */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-slate-200 dark:border-slate-600 transition-colors">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Your Board</h1>
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

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm rounded-lg transition-colors">
            {error}
          </div>
        )}

        {/* Task Creator Form */}
        {isCreating && (
          <form onSubmit={handleCreateTask} className="mb-8 p-6 bg-white/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 backdrop-blur-md rounded-2xl max-w-xl shadow-lg transition-colors">
            <h3 className="text-base font-bold mb-4 text-slate-900 dark:text-white">Create a New Issue</h3>
            <div className="mb-4">
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-300 mb-2">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Database replication strategy..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-gunmetal border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-dusty-denim focus:ring-1 focus:ring-dusty-denim/30 transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-400"
              />
            </div>
            <div className="mb-4">
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-300 mb-2">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Analyze master-slave synchronization latencies..."
                rows="3"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-gunmetal border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-dusty-denim focus:ring-1 focus:ring-dusty-denim/30 transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-400 resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-dusty-denim hover:bg-ocean-mist text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Commit to Board
            </button>
          </form>
        )}

        {/* 3-Column Kanban Board Grid with DragDropContext */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column 1: To Do */}
            <Droppable droppableId="TODO">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  className={`border rounded-2xl p-5 flex flex-col h-[calc(100vh-250px)] min-h-[400px] transition-colors ${
                    snapshot.isDraggingOver ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' : 'bg-blue-50/70 dark:bg-blue-900/10 border-blue-200/60 dark:border-blue-800/40'
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
                  className={`border rounded-2xl p-5 flex flex-col h-[calc(100vh-250px)] min-h-[400px] transition-colors ${
                    snapshot.isDraggingOver ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700' : 'bg-amber-50/70 dark:bg-amber-900/10 border-amber-200/60 dark:border-amber-800/40'
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
                  className={`border rounded-2xl p-5 flex flex-col h-[calc(100vh-250px)] min-h-[400px] transition-colors ${
                    snapshot.isDraggingOver ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700' : 'bg-emerald-50/70 dark:bg-emerald-900/10 border-emerald-200/60 dark:border-emerald-800/40'
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
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl p-6 shadow-2xl relative transition-colors">
            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Edit Task</h3>
            <form onSubmit={handleEditTask} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-gunmetal border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-dusty-denim focus:ring-1 focus:ring-dusty-denim/30 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-2">Description (Optional)</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-gunmetal border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-dusty-denim focus:ring-1 focus:ring-dusty-denim/30 transition-all text-sm resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-600/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-dusty-denim hover:bg-ocean-mist text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
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
            className={`group relative p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl transition-shadow shadow-sm dark:shadow-md hover:border-dusty-denim/50 dark:hover:border-dusty-denim/50 ${
              snapshot.isDragging ? 'shadow-xl ring-2 ring-dusty-denim/50 scale-105 opacity-90 z-50' : ''
            }`}
          >
            <div className="flex justify-between items-start gap-2 mb-2">
              <div className="flex gap-2 items-start flex-1">
                <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-500 mt-0.5 cursor-grab active:cursor-grabbing flex-shrink-0" />
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">{task.title}</h4>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => startEditing(task)}
                  className="text-slate-400 dark:text-slate-400 hover:text-dusty-denim dark:hover:text-dusty-denim opacity-0 group-hover:opacity-100 transition-opacity p-1 text-xs cursor-pointer"
                  title="Edit task"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-xs cursor-pointer"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {task.description && (
              <p className="text-xs text-slate-500 dark:text-slate-300 mb-2 line-clamp-3 leading-relaxed pl-6">
                {task.description}
              </p>
            )}
          </div>
        )}
      </Draggable>
    );
  }
}