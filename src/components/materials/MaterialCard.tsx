import { FileText, Video, Link2, Lock } from "lucide-react";
import type { Material } from "@/lib/types/materials";

const typeConfig = {
  document: { icon: FileText, colorClass: "text-red-500", bgClass: "bg-red-50" },
  video: { icon: Video, colorClass: "text-blue-500", bgClass: "bg-blue-50" },
  link: { icon: Link2, colorClass: "text-emerald-500", bgClass: "bg-emerald-50" },
};

const batchColors: Record<string, string> = {
  "A/L Batch A": "text-blue-500",
  "A/L Batch B": "text-emerald-500",
  "A/L Batch C": "text-purple-500",
  "O/L Batch A": "text-blue-400",
};

export function MaterialCard({ material }: { material: Material }) {
  const { icon: Icon, colorClass, bgClass } = typeConfig[material.type];
  const batchColor = batchColors[material.batch] || "text-gray-500";

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex-1">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${bgClass}`}>
          <Icon className={colorClass} size={20} />
        </div>
        
        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${batchColor}`}>
          {material.batch}
        </p>
        
        <h3 className="text-base font-bold text-gray-900 leading-tight mb-1 line-clamp-2">
          {material.title}
        </h3>
        
        <p className="text-xs text-gray-400 mb-6">
          {material.subject}
        </p>
      </div>

      <div className="mt-auto">
        <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium mb-3">
          <span>{material.date}</span>
          <span>
            {material.size && `${material.size} • `}
            {typeof material.downloads === "number" ? `${material.downloads} downloads` : "Cloudinary file"}
          </span>
        </div>

        {material.fileUrl && (
          <a
            href={material.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            Open material
          </a>
        )}
        
        {material.isRestricted && (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-semibold">
            <Lock size={12} className="text-amber-500" />
            Enrolled students only
          </div>
        )}
      </div>
    </div>
  );
}
