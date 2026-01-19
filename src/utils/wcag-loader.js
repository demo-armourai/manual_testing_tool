
import checkData from '../data/checks.json';

// Principle and Guideline Mappings (Since they aren't in checks.json)
const PRINCIPLES = {
    '1': 'Perceivable',
    '2': 'Operable',
    '3': 'Understandable',
    '4': 'Robust'
};

const GUIDELINES = {
    '1.1': 'Text Alternatives',
    '1.2': 'Time-based Media',
    '1.3': 'Adaptable',
    '1.4': 'Distinguishable',
    '2.1': 'Keyboard Accessible',
    '2.2': 'Enough Time',
    '2.3': 'Seizures and Physical Reactions',
    '2.4': 'Navigable',
    '2.5': 'Input Modalities',
    '3.1': 'Readable',
    '3.2': 'Predictable',
    '3.3': 'Input Assistance',
    '4.1': 'Compatible'
};

const parseSCString = (scString) => {
    // Normalize string: replace newlines/tabs with spaces, collapse multiple spaces, trim
    const normalized = scString.replace(/[\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();

    // Format: "1.1.1 Non-text Content (A)"
    // Regex allows for optional spaces around parts and is more permissive
    const match = normalized.match(/^(\d+\.\d+\.\d+)\s+(.+?)\s*\((A|AA|AAA)\)$/);

    if (match) {
        return {
            id: match[1],
            title: match[2].trim(),
            level: match[3]
        };
    }
    return { id: '', title: normalized, level: 'A' }; // Fallback
};

export const loadWCAGChecklist = () => {
    const aggregated = {};

    checkData.forEach(item => {
        const scStr = item["Success Criterion"];
        if (!scStr) return;

        if (!aggregated[scStr]) {
            const { id, title, level } = parseSCString(scStr);
            const principleId = id.split('.')[0];
            const guidelineId = id.split('.').slice(0, 2).join('.');

            aggregated[scStr] = {
                id: id,
                scId: `SC ${id}`,
                title: title,
                level: level,
                principle: PRINCIPLES[principleId] || 'Unknown Check',
                guideline: GUIDELINES[guidelineId] || 'Unknown Guideline',
                guidelineNumber: guidelineId,
                description: item["webaim checks"] || '', // Use webaim text as description
                replacementText: '',
                type: ['Visual', 'Screen Reader'], // Defaulting as not present in JSON
                automationCoverage: 'none', // Will calculate based on rules presence
                defaultSeverity: 'Moderate', // Default
                checks: [], // We will accumulate conditions here
                axeRules: [] // Accumulate axe-core rules here
            };
        }

        // Merge conditions
        // "Total conditions" is an array of strings
        if (item["Total conditions"] && Array.isArray(item["Total conditions"])) {
            item["Total conditions"].forEach(condition => {
                if (!aggregated[scStr].checks.includes(condition)) {
                    aggregated[scStr].checks.push(condition);
                }
            });
        }

        // Merge axe-core rules
        const axeRule = item["axe-core Rule"];
        if (axeRule && axeRule !== "No axe-core rule" && !aggregated[scStr].axeRules.includes(axeRule)) {
            aggregated[scStr].axeRules.push(axeRule);
        }

        // Update automation coverage if any rule is present
        if (aggregated[scStr].axeRules.length > 0) {
            aggregated[scStr].automationCoverage = 'partial';
        }
    });

    return Object.values(aggregated).sort((a, b) => {
        // Simple version sort
        const partsA = a.id.split('.').map(Number);
        const partsB = b.id.split('.').map(Number);
        for (let i = 0; i < 3; i++) {
            if (partsA[i] !== partsB[i]) return (partsA[i] || 0) - (partsB[i] || 0);
        }
        return 0;
    });
};

export const wcagChecklist = loadWCAGChecklist();

export const getChecklistByLevel = (level) => {
    if (Array.isArray(level)) {
        return wcagChecklist.filter(item => level.includes(item.level));
    }
    // Handle single string case if legacy code uses it
    if (level === 'A')
        return wcagChecklist.filter(sc => sc.level === 'A');
    if (level === 'AA')
        return wcagChecklist.filter(sc => sc.level === 'A' || sc.level === 'AA');
    return wcagChecklist;
};

export const getChecklistByPrinciple = (principle) => {
    return wcagChecklist.filter(sc => sc.principle === principle);
};

export const getChecklistByType = (type) => {
    return wcagChecklist.filter(sc => sc.type && sc.type.includes(type));
};

export const getChecklistByGuideline = (guidelineNumber) => {
    return wcagChecklist.filter(sc => sc.guidelineNumber === guidelineNumber);
};

export const getSCById = (id) => {
    return wcagChecklist.find(sc => sc.id === id);
};
