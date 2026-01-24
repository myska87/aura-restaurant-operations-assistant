import React from 'react';

export default function DebugTrainingState({ journeyProgress, currentModuleId }) {
  if (!journeyProgress) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-900 text-white p-4 rounded text-xs font-mono max-w-sm">
        <p>⚠️ DEBUG: journeyProgress is NULL</p>
      </div>
    );
  }

  const quizPassed = journeyProgress.moduleStatuses?.[currentModuleId] === 'quiz_passed';
  const moduleCompleted = journeyProgress.moduleStatuses?.[currentModuleId] === 'completed';

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900 text-white p-4 rounded text-xs font-mono max-w-sm space-y-1 border-2 border-amber-500">
      <div className="font-bold text-amber-400">DEBUG: Training State</div>
      <div><span className="text-blue-300">currentModuleId:</span> {currentModuleId}</div>
      <div><span className="text-blue-300">activeModuleIndex:</span> {journeyProgress.currentModuleIndex}</div>
      <div><span className="text-blue-300">quizPassed:</span> <span className={quizPassed ? 'text-emerald-400' : 'text-red-400'}>{quizPassed ? 'TRUE ✓' : 'FALSE ✗'}</span></div>
      <div><span className="text-blue-300">moduleCompleted:</span> <span className={moduleCompleted ? 'text-emerald-400' : 'text-red-400'}>{moduleCompleted ? 'TRUE ✓' : 'FALSE ✗'}</span></div>
      <div className="mt-2 pt-2 border-t border-slate-600">
        <div className="text-yellow-300 font-bold">All Module Statuses:</div>
        {Object.entries(journeyProgress.moduleStatuses || {}).map(([moduleId, status]) => (
          <div key={moduleId}>{moduleId}: <span className={status === 'completed' ? 'text-emerald-400' : status === 'quiz_passed' ? 'text-blue-400' : 'text-slate-400'}>{status}</span></div>
        ))}
      </div>
    </div>
  );
}