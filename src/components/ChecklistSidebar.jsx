import { useState } from 'react';
import { ChevronDown, ChevronRight, Circle, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { wcagChecklist } from '../utils/wcag-loader';
import { useAuditStore } from '../hooks/useAuditStore';
export function ChecklistSidebar({ selectedSC, onSelectSC, filters }) {
    const [expandedPrinciples, setExpandedPrinciples] = useState(new Set(['Perceivable', 'Operable', 'Understandable', 'Robust']));
    const { getCheckStatus, error } = useAuditStore();
    const togglePrinciple = (principle) => {
        const newExpanded = new Set(expandedPrinciples);
        if (newExpanded.has(principle)) {
            newExpanded.delete(principle);
        }
        else {
            newExpanded.add(principle);
        }
        setExpandedPrinciples(newExpanded);
    };
    const filteredChecklist = wcagChecklist.filter(sc => {
        if (filters.principles.length > 0 && !filters.principles.includes(sc.principle))
            return false;
        if (filters.levels.length > 0 && !filters.levels.includes(sc.level))
            return false;
        if (filters.types.length > 0 && !sc.type.some(t => filters.types.includes(t)))
            return false;
        return true;
    });
    const groupedByPrinciple = filteredChecklist.reduce((acc, sc) => {
        if (!acc[sc.principle])
            acc[sc.principle] = [];
        acc[sc.principle].push(sc);
        return acc;
    }, {});
    const getStatusIcon = (status) => {
        switch (status) {
            case 'pass':
                return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case 'fail':
                return <XCircle className="w-4 h-4 text-rose-500" />;
            case 'na':
                return <MinusCircle className="w-4 h-4 text-gray-400" />;
            default:
                return <Circle className="w-4 h-4 text-gray-200" />;
        }
    };

    return (
        <div className="h-full overflow-y-auto bg-white">
            {/* Added a subtle gradient at the top if needed, or just padding */}
            <div className="p-2 pb-20"> {/* pb-20 for bottom safe area */}
                <h3 className="mb-4 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Success Criteria</h3>

                {error && (
                    <div className="mx-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2 text-xs">
                        <div className="font-bold flex-shrink-0">⚠️</div>
                        <div className="flex-1">{error}</div>
                    </div>
                )}

                {Object.keys(groupedByPrinciple).map(principle => (
                    <div key={principle} className="mb-1">
                        <button
                            onClick={() => togglePrinciple(principle)}
                            className="flex items-center gap-2 w-full p-2 hover:bg-gray-50 rounded-lg text-gray-700 font-medium transition-colors text-sm"
                        >
                            {expandedPrinciples.has(principle)
                                ? <ChevronDown className="w-4 h-4 text-slate-400" />
                                : <ChevronRight className="w-4 h-4 text-slate-400" />
                            }
                            <span>{principle}</span>
                        </button>

                        {expandedPrinciples.has(principle) && (
                            <div className="ml-2 mt-1 space-y-0.5 border-l border-gray-100 pl-2">
                                {groupedByPrinciple[principle].map(sc => {
                                    const status = getCheckStatus(sc.id);
                                    const isSelected = selectedSC === sc.id;
                                    return (
                                        <button
                                            key={sc.id}
                                            onClick={() => onSelectSC(sc.id)}
                                            className={`
                                                flex items-center gap-3 w-full p-2 rounded-md text-left text-sm transition-all duration-200
                                                ${isSelected
                                                    ? 'bg-blue-50 border border-blue-100 text-blue-900 shadow-sm'
                                                    : 'text-gray-600 border border-transparent hover:bg-gray-50 hover:text-gray-900'
                                                }
                                            `}
                                        >
                                            <div className="flex-shrink-0 mt-0.5">
                                                {getStatusIcon(status)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-xs opacity-70 mb-0.5">
                                                    {sc.id}
                                                </div>
                                                <div className="truncate text-sm leading-tight">
                                                    {sc.title}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
