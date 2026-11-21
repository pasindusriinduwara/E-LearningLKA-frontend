import type { Submission } from "@/lib/types/assignment";

export function ResultsTable({ results, onGrade, disabled = false }: { results: Submission[]; onGrade: (result: Submission) => void; disabled?: boolean }) {
  return <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="overflow-x-auto">
    <table className="w-full min-w-[760px] text-left text-sm">
      <thead className="border-b border-gray-100 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-400"><tr>{["Rank", "Student", "Marks", "Grade", "Publication", "Action"].map((title) => <th key={title} scope="col" className="px-5 py-4">{title}</th>)}</tr></thead>
      <tbody className="divide-y divide-gray-100">
        {results.map((result) => <tr key={result.id} className="hover:bg-gray-50/60">
          <td className="px-5 py-4 font-bold text-emerald-700">{result.rank ? `#${result.rank}` : "—"}</td>
          <td className="px-5 py-4"><p className="font-semibold text-gray-900">{result.studentName}</p><p className="mt-1 text-xs text-gray-400">ID {result.studentId}</p></td>
          <td className="px-5 py-4 font-semibold text-gray-900">{result.marks === null ? "Not graded" : <>{result.marks}<span className="text-xs font-normal text-gray-400"> / {result.totalMarks}</span></>}</td>
          <td className="px-5 py-4"><span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${result.grade && result.grade !== "F" && result.grade !== "N/A" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{result.marks === null ? "—" : result.grade || "—"}</span></td>
          <td className="px-5 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${result.resultPublished ? "bg-emerald-50 text-emerald-700" : result.status === "Graded" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"}`}>{result.resultPublished ? "Published" : result.status === "Graded" ? "Ready to publish" : "Awaiting grading"}</span></td>
          <td className="px-5 py-4"><button type="button" disabled={disabled} onClick={() => onGrade(result)} className="rounded-lg border border-emerald-100 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">{result.status === "Graded" ? "Review grade" : "Grade submission"}</button></td>
        </tr>)}
        {results.length === 0 && <tr><td colSpan={6} className="px-6 py-14 text-center text-gray-500">No student submissions match this view.</td></tr>}
      </tbody>
    </table>
  </div></div>;
}
