import { Calendar } from "lucide-react";

interface CreateAssignmentFormProps {
  onCancel: () => void;
}

export function CreateAssignmentForm({ onCancel }: CreateAssignmentFormProps) {
  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
      <h2 className="text-xl font-bold text-gray-900 mb-6 font-serif">New assignment</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Title */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Title</label>
          <input 
            type="text" 
            placeholder="Assignment title" 
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
          />
        </div>
        
        {/* Batch */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Batch</label>
          <div className="relative">
            <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm appearance-none cursor-pointer">
              <option>A/L Batch A</option>
              <option>A/L Batch B</option>
              <option>O/L Batch A</option>
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Due Date</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="mm/dd/yyyy" 
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
            />
            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>

        {/* Total Marks */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Total Marks</label>
          <input 
            type="text" 
            placeholder="50" 
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-8">
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Instructions</label>
        <textarea 
          placeholder="Describe what students should do..." 
          rows={3}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm resize-none"
        ></textarea>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button 
          onClick={onCancel}
          className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button 
          className="px-6 py-2.5 text-sm font-semibold text-white bg-[#2D9F75] hover:bg-emerald-600 rounded-xl transition-colors shadow-sm"
        >
          Publish
        </button>
      </div>
    </div>
  );
}