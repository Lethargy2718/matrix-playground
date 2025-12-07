export const RREF_ACTIONS = {
    START: "Start RREF Process",
    SEARCH_PIVOT: "Search for Pivot",
    PIVOT_FOUND: "Pivot Found",
    SWAP_NEEDED: "Row Swap Needed",
    SWAP: "Row Swap",
    PIVOT_CORRECT_POSITION: "Pivot in Correct Position",
    SCALE_EXPLANATION: "Scaling Explanation",
    SCALE: "Row Scaling",
    PIVOT_ALREADY_ONE: "Pivot Already One",
    ELIMINATE_EXPLANATION: "Elimination Strategy",
    ELIMINATE: "Row Elimination",
    NO_ELIMINATION_NEEDED: "No Elimination Needed",
    PIVOT_COMPLETE: "Pivot Complete",
    NO_PIVOT_DETAILED: "No Pivot Found",
    FINAL: "Final RREF"
};

export const SOLUTION_TYPES = {
    CONTRADICTION_FOUND: "Contradiction Found",
    RANK_EXPLANATION: "Rank Explanation",
    THEOREM_EXPLANATION: "Theorem Explanation",
    SOLUTION_TYPE_DETERMINED: "Solution Type Determined",
    UNIQUE_SOLUTION_VALUES: "Unique Solution",
    INFINITE_SOLUTIONS_GENERAL: "Infinite Solutions",
    NO_SOLUTION: "No Solution"
};

export const PHASES = {
    RREF: "rref",
    ANALYSIS: "analysis",
    SOLUTION: "solution"
};

export const SOLVE_TYPES = Object.freeze({
    RREF: 'rref',
    FULL: 'full',
    REF: 'ref',
    INVERSE: 'inverse',
});
