import { Bell, Clock, MapPin, Video, CheckCircle2, Clock3 } from "lucide-react";

export function TeacherWidgets() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Today's Classes */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Today</h3>
        <h2 className="text-xl font-extrabold text-gray-900 font-serif mb-4">Today&apos;s classes</h2>
        <div className="space-y-3">
          <div className="bg-white p-5 rounded-2xl border-l-4 border-l-emerald-500 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-bold text-gray-900">Pure Mathematics</h4>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-uppercase">In person</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">A/L Batch B • Sinhala</p>
            <div className="flex items-center text-xs text-gray-500 gap-4">
              <span className="flex items-center gap-1"><Clock size={14} /> 4:30 - 6:30 PM</span>
              <span className="flex items-center gap-1"><MapPin size={14} /> Studio 2</span>
              <span className="flex items-center gap-1">👥 32 students</span>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border-l-4 border-l-blue-500 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-bold text-gray-900">Combined Maths</h4>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-uppercase">Online</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">A/L Batch A • English</p>
            <div className="flex items-center text-xs text-gray-500 gap-4">
              <span className="flex items-center gap-1"><Clock size={14} /> 6:45 - 8:15 PM</span>
              <span className="flex items-center gap-1"><Video size={14} /> Live class</span>
              <span className="flex items-center gap-1">👥 24 students</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Students</h3>
        <h2 className="text-xl font-extrabold text-gray-900 font-serif mb-4">Recent activity</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-2 space-y-1">
          {[
            { name: "Sahan Amarasinghe", batch: "A/L Batch B", att: "92%", color: "bg-blue-500" },
            { name: "Amali Perera", batch: "A/L Batch A", att: "88%", color: "bg-emerald-500" },
            { name: "Kasun Fernando", batch: "A/L Batch C", att: "74%", color: "bg-amber-500", warn: true },
            { name: "Nimasha Silva", batch: "A/L Batch B", att: "96%", color: "bg-purple-500" },
          ].map((student, i) => (
            <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${student.color} text-white flex items-center justify-center font-bold text-xs`}>
                  {student.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{student.name}</h4>
                  <p className="text-xs text-gray-500">{student.batch}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-sm font-bold ${student.warn ? "text-amber-600" : "text-emerald-600"}`}>{student.att}</span>
                <p className="text-[10px] text-gray-400">attendance</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Tasks */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Action Required</h3>
        <h2 className="text-xl font-extrabold text-gray-900 font-serif mb-4">Pending tasks</h2>
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="bg-amber-50 p-2 rounded-full text-amber-500 mt-0.5"><Clock3 size={16} /></div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Assignment</p>
              <h4 className="text-sm font-bold text-gray-900 mb-1">Integration — 18 submissions waiting</h4>
              <p className="text-xs text-gray-400">2 hours ago</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="bg-red-50 p-2 rounded-full text-red-500 mt-0.5"><CheckCircle2 size={16} /></div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Attendance</p>
              <h4 className="text-sm font-bold text-gray-900 mb-1">Batch C session on 24 Aug not marked</h4>
              <p className="text-xs text-gray-400">1 day ago</p>
            </div>
          </div>

          <div className="bg-[#133A2D] rounded-2xl p-5 text-white mt-4 relative overflow-hidden">
             <div className="relative z-10">
               <div className="flex items-center gap-2 mb-2">
                 <Bell size={16} className="text-emerald-400" />
                 <h4 className="font-bold">Post announcement</h4>
               </div>
               <p className="text-emerald-100/70 text-xs mb-4">Share something with your students...</p>
               <button className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                 Send to all batches
               </button>
             </div>
          </div>
        </div>
      </div>

    </div>
  );
}
