import React from 'react';

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <div className="p-8 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 text-center max-w-md">
        <h1 className="text-3xl font-extrabold text-indigo-400 mb-2">DevBoard UI Live</h1>
        <p className="text-slate-400 mb-6">
          React is running smoothly and Tailwind CSS is officially compiled!
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors cursor-pointer">
          Ready for Authentication Screens
        </div>
      </div>
    </div>
  );
}

export default App;