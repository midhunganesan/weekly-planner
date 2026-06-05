import React, { useState, useEffect } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CheckCircle2, Circle, Trash2, LogOut, RotateCcw, Target, Trophy, Sparkles, Camera } from 'lucide-react';
import html2canvas from 'html2canvas';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Login Page Component
const LoginPage = () => (
  <div className="h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
    <div className="text-center space-y-8 max-w-md w-full">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight">
          Weekly Planner
        </h1>
        <p className="text-lg sm:text-xl text-slate-300 font-medium">
          Plan your week. Track your habits. Stay consistent.
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <p className="text-sm text-slate-400">
          Organize your tasks, build lasting habits, and achieve your weekly goals.
        </p>
      </div>

      {/* Sign-In Button */}
      <div className="pt-8">
        <button 
          onClick={() => signInWithPopup(auth, googleProvider)}
          className="w-full bg-white text-slate-900 px-8 py-4 rounded-lg shadow-lg text-base font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/><path fill="currentColor" d="M1 1h22v22H1z" fillOpacity=".07"/>
          </svg>
          Sign in with Google
        </button>
      </div>

      {/* Footer */}
      <div className="pt-8 border-t border-slate-700">
        <p className="text-xs text-slate-500">
          By signing in, you agree to our terms of service and privacy policy
        </p>
      </div>
    </div>
  </div>
);

const TinyDonut = ({ percentage }) => (
  <div className="w-6 h-6">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={[{ value: percentage }, { value: 100 - (percentage || 0.1) }]}
          innerRadius={8}
          outerRadius={12}
          stroke="none"
          dataKey="value"
          startAngle={90}
          endAngle={-270}
        >
          <Cell fill="#22c55e" />
          <Cell fill="#f1f5f9" />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  </div>
);

export default function CompactDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [localData, setLocalData] = useState({
    focus: '',
    reward: '',
    affirmation: '',
    tasks: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] },
    habits: []
}); 
  const [inputs, setInputs] = useState({}); // Stores inline task inputs
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [isHabitModalOpen, setHabitModalOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');

  useEffect(() => {
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log("Persistence set");
    })
    .catch((error) => {
      console.error("Persistence error:", error);
    });
}, []);

useEffect(() => {
  const unsub = onAuthStateChanged(auth, (u) => {
    setUser(u);
    setLoading(false);
  });
  return unsub;
}, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid, "currentWeek", "data"), (doc) => {
      if (doc.exists()) {
  setLocalData(doc.data());
}
    });
    return unsub;
  }, [user]);

const updateLocalAndDB = (newData) => {
  setLocalData(newData);

  // Clear previous timer
  if (saveTimeout) clearTimeout(saveTimeout);

  // Create new delayed save
  const timeout = setTimeout(async () => {
    try {
      await setDoc(doc(db, "users", user.uid, "currentWeek", "data"), newData);
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  }, 500); // delay (0.5 sec)

  setSaveTimeout(timeout);
};

  const handleAddTask = (day) => {
    const taskText = inputs[day];
    if (!taskText?.trim()) return;
    const newData = { ...localData };
    newData.tasks[day].push({ id: Date.now(), text: taskText, completed: false });
    updateLocalAndDB(newData);
    setInputs({ ...inputs, [day]: '' });
  };

  const toggleTask = (day, taskId) => {
    const newData = { ...localData };
    newData.tasks[day] = newData.tasks[day].map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    updateLocalAndDB(newData);
  };

  const deleteHabit = (id) => {
    const newData = { ...localData, habits: localData.habits.filter(h => h.id !== id) };
    updateLocalAndDB(newData);
  };

  const addHabit = (name) => {
    if (!name || !name.trim()) return;
    const newData = {...localData, habits: [...localData.habits, {id: Date.now(), name: name.trim(), status: Array(7).fill(false)}]};
    updateLocalAndDB(newData);
  };

  const calculateDayProgress = (day) => {
    const tasks = localData.tasks?.[day] || [];
    if (!tasks || tasks.length === 0) return 0;
    return Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
  };

  const calculateTotalProgress = () => {
    const allTasks = Object.values(localData.tasks || {}).flat();
    if (allTasks.length === 0) return 0;
    return Math.round((allTasks.filter(t => t.completed).length / allTasks.length) * 100);
  };

  const handleSaveSnapshot = async () => {
    try {
      // Get the main dashboard container
      const element = document.getElementById('planner-dashboard');
      if (!element) {
        alert('Could not find planner dashboard');
        return;
      }

      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        backgroundColor: '#0f172a', // slate-950
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Format filename with current date
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        link.download = `weekly-planner-${dateStr}.png`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('Error capturing snapshot:', error);
      alert('Failed to capture snapshot. Please try again.');
    }
  };

  if (loading) {
  return (
    <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="space-y-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-green-500 border-opacity-75 mx-auto"></div>
        <p className="text-slate-400">Loading your planner...</p>
      </div>
    </div>
  );
}

if (!user) return <LoginPage />;

  return (
    <div id="planner-dashboard" className="h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-3 sm:p-4 flex flex-col gap-3 font-sans overflow-hidden">
      
      {/* TOP COMPACT SECTION */}
      <div className="grid grid-cols-12 gap-3 h-auto lg:h-32 shrink-0">
        
        {/* Weekly Focus Area */}
        <div className="col-span-12 lg:col-span-3 bg-white/5 backdrop-blur-md border border-white/10 shadow-lg rounded p-3 flex flex-col justify-between hover:border-white/20 transition-colors">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-400">
              <Target size={14}/> <span className="text-xs font-bold uppercase tracking-wide">Weekly Focus</span>
            </div>
            <input 
              className="w-full text-sm font-semibold outline-none bg-transparent border-b border-slate-600 focus:border-green-500 text-slate-100 placeholder-slate-500 transition-colors"
              value={localData.focus}
              onChange={(e) => updateLocalAndDB({...localData, focus: e.target.value})}
              placeholder="Set your main objective..."
            />
          </div>
          <div className="space-y-2 border-t border-slate-700 pt-3 mt-3">
            <div className="flex items-center gap-2 text-slate-400">
              <Trophy size={14}/> <span className="text-xs font-bold uppercase tracking-wide">Reward</span>
            </div>
            <input 
              className="w-full text-sm outline-none bg-transparent border-b border-slate-600 focus:border-green-500 text-slate-100 placeholder-slate-500 transition-colors"
              value={localData.reward}
              onChange={(e) => updateLocalAndDB({...localData, reward: e.target.value})}
              placeholder="What will you earn?..."
            />
          </div>
        </div>

        {/* Global Progress Chart */}
        <div className="col-span-12 lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 shadow-lg rounded flex flex-col items-center justify-center p-2 hover:border-white/20 transition-colors">
          <div className="w-20 h-20">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[{ value: calculateTotalProgress() }, { value: 100 - (calculateTotalProgress() || 0.1) }]}
                  innerRadius={24}
                  outerRadius={34}
                  stroke="none"
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#f1f5f9" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold leading-none text-white">{calculateTotalProgress()}%</span>
              <span className="text-xs font-semibold text-slate-400 uppercase">Weekly</span>
            </div>
          </div>
        </div>

        {/* Habit Grid (High Density) */}
        <div className="col-span-12 lg:col-span-7 bg-white/5 backdrop-blur-md border border-white/10 shadow-lg rounded p-2 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Habit Tracker</span>
            <button onClick={() => setHabitModalOpen(true)} className="text-green-500 hover:text-green-400 hover:bg-green-500/10 px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 transition-colors">
              + NEW HABIT
            </button>
          </div>
          <div className="flex-1 overflow-x-auto habit-tracker-scroll">
            <table className="w-full text-xs whitespace-nowrap">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700 sticky top-0 bg-slate-900/50">
                  <th className="text-left font-semibold pb-2 px-2 min-w-[140px]">Activity</th>
                  {DAYS.map(d => <th key={d} className="font-semibold pb-2 px-1.5 text-center">{d.slice(0,3)}</th>)}
                  <th className="text-right font-semibold pb-2 px-2 min-w-[50px]">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {localData.habits.map(habit => (
                  <tr key={habit.id} className="group hover:bg-white/5 transition-colors">
                    <td className="py-2 px-2 flex items-center gap-1.5 min-w-[140px]">
                      <button onClick={() => deleteHabit(habit.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-opacity"><Trash2 size={12}/></button>
                      <span className="truncate text-slate-200 font-medium">{habit.name}</span>
                    </td>
                    {habit.status.map((s, idx) => (
                      <td key={idx} className="text-center py-2 px-1.5">
                        <input 
                          type="checkbox" checked={s} 
                          onChange={() => {
                            const newData = {...localData};
                            newData.habits = newData.habits.map(h => h.id === habit.id ? {...h, status: h.status.map((v, i) => i === idx ? !v : v)} : h);
                            updateLocalAndDB(newData);
                          }}
                          className="w-4 h-4 accent-green-500 cursor-pointer rounded"
                        />
                      </td>
                    ))}
                    <td className="text-right font-bold text-green-500 py-2 px-2 min-w-[50px]">
                      {Math.round((habit.status.filter(Boolean).length / 7) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 7-COLUMN MAIN BODY - Desktop Grid / Mobile Horizontal Scroll */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex gap-2 lg:grid lg:grid-cols-7 lg:gap-2 overflow-x-auto planner-scroll scroll-snap-container">
          {DAYS.map(day => {
            const progress = calculateDayProgress(day);
            return (
              <div key={day} className="bg-white/5 backdrop-blur-md border border-white/10 shadow-lg rounded flex flex-col overflow-hidden min-w-[240px] sm:min-w-[260px] shrink-0 lg:min-w-0 lg:shrink hover:border-white/20 transition-colors scroll-snap-item">
                {/* Day Header - Unified Row */}
                <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-3 py-2 border-b border-slate-600 flex items-center justify-between shrink-0">
                  <span className="text-sm font-bold text-slate-100">{day}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-green-400">{progress}%</span>
                    <TinyDonut percentage={progress} />
                  </div>
                </div>

                {/* Task List - Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {(localData.tasks?.[day] || []).map(task => (
                    <div key={task.id} className="group flex items-start gap-2 p-2 rounded hover:bg-white/10 transition-all duration-150" >
                      <button onClick={() => toggleTask(day, task.id)} className="shrink-0 mt-0.5">
                        {task.completed ? <CheckCircle2 size={16} className="text-green-500" /> : <Circle size={16} className="text-slate-400" />}
                      </button>
                      <span className={`text-sm leading-tight flex-1 break-words ${task.completed ? 'line-through text-slate-500' : 'text-slate-200 font-medium'}`}>
                        {task.text}
                      </span>
                      <button 
                        onClick={() => {
                          const newData = {...localData};
                          newData.tasks[day] = newData.tasks[day].filter(t => t.id !== task.id);
                          updateLocalAndDB(newData);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-opacity shrink-0"
                      >
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Inline Input Field */}
                <div className="p-2 border-t border-slate-700 bg-white/5 shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      className="flex-1 min-w-0 text-sm p-2 outline-none bg-white/10 text-white placeholder-slate-500 caret-green-400 rounded border border-slate-600 focus:border-green-500 focus:shadow-[0_0_10px_rgba(34,197,94,0.5)] transition-all"
                      value={inputs[day] || ''}
                      onChange={(e) => setInputs({...inputs, [day]: e.target.value})}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTask(day)}
                      placeholder="Add task..."
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTask(day)}
                      aria-label="Add task"
                      className="shrink-0 flex items-center justify-center w-9 h-9 rounded border border-slate-600 bg-white/10 text-green-500 hover:bg-green-500/20 hover:border-green-500 transition-all text-lg font-bold leading-none"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Habit Creation Modal */}
      {isHabitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setHabitModalOpen(false)} />
          <div className="relative max-w-md w-full bg-slate-900 border border-white/10 rounded-lg p-4 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-2">Add New Habit</h3>
            <input
              autoFocus
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              className="w-full p-2 rounded bg-slate-800 border border-slate-700 text-white placeholder-slate-400 mb-3"
              placeholder="Habit name"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setHabitModalOpen(false); setNewHabitName(''); }} className="px-3 py-1.5 bg-transparent border border-slate-700 text-slate-300 rounded">Cancel</button>
              <button onClick={() => { addHabit(newHabitName); setNewHabitName(''); setHabitModalOpen(false); }} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded">Add Habit</button>
            </div>
          </div>
        </div>
      )}

      {/* COMPACT FOOTER */}
      <div className="h-auto sm:h-10 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 px-3 py-2 bg-white/5 backdrop-blur-md border border-white/10 shadow-lg rounded">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <button 
            onClick={handleSaveSnapshot}
            className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-green-500 transition-colors hover:bg-green-500/10 px-3 py-1.5 rounded"
          >
            <Camera size={14}/> Save Weekly Snapshot
          </button>
          <button 
            onClick={() => { if(window.confirm("Clear week?")) updateLocalAndDB({...localData, tasks: DAYS.reduce((acc, d) => ({...acc, [d]: []}), {})}); }}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors hover:bg-red-500/10 px-3 py-1.5 rounded"
          >
            <RotateCcw size={14}/> RESET WEEK
          </button>
          <div className="hidden sm:block h-4 w-[1px] bg-slate-700" />
          <span className="text-xs font-medium text-slate-400 flex items-center gap-2">
             <Sparkles size={14}/> Consistency: <span className="text-green-400 font-bold">{Math.round(calculateTotalProgress() * 0.8)}%</span>
          </span>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs font-medium text-slate-400 truncate">{user.email}</span>
          <button onClick={() => signOut(auth)} className="text-slate-400 hover:text-slate-300 hover:bg-red-500/10 p-2 rounded transition-colors">
            <LogOut size={16}/>
          </button>
        </div>
      </div>
    </div>
  );
}