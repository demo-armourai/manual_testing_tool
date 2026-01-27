import { X, Filter } from 'lucide-react';

export function FilterPanel({ filters, onFilterChange }) {
  const togglePrinciple = (principle) => {
    const newPrinciples = filters.principles.includes(principle)
      ? filters.principles.filter(p => p !== principle)
      : [...filters.principles, principle];
    onFilterChange({ ...filters, principles: newPrinciples });
  };

  const toggleLevel = (level) => {
    const newLevels = filters.levels.includes(level)
      ? filters.levels.filter(l => l !== level)
      : [...filters.levels, level];
    onFilterChange({ ...filters, levels: newLevels });
  };

  const clearAll = () => {
    onFilterChange({ principles: [], levels: [], types: [] });
  };

  const hasFilters = filters.principles.length > 0 || filters.levels.length > 0 || filters.types.length > 0;

  return (
    <div className="bg-white/50 backdrop-blur-sm border-b border-slate-200 p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-slate-900 font-bold">
          <Filter className="w-4 h-4 text-slate-400" />
          <h3 className="uppercase tracking-wide text-xs">Filters</h3>
        </div>

        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors px-2 py-1 hover:bg-rose-50 rounded"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Principle */}
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">WCAG Principles</div>
          <div className="flex flex-wrap gap-2">
            {['Perceivable', 'Operable', 'Understandable', 'Robust'].map(principle => (
              <button
                key={principle}
                onClick={() => togglePrinciple(principle)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 border ${filters.principles.includes(principle)
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-200 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 hover:shadow-sm'
                  }`}
              >
                {principle}
              </button>
            ))}
          </div>
        </div>

        {/* Level */}
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Conformance Level</div>
          <div className="flex gap-2">
            {['A', 'AA', 'AAA'].map(level => (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 border ${filters.levels.includes(level)
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-200 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 hover:shadow-sm'
                  }`}
              >
                Level {level}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
