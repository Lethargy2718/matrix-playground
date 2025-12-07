import { formatNumber } from './helpers';

export const Matrix = {
    create(data) {
        const matrix = {
            data: structuredClone(data),
            rows: data.length,
            cols: data[0]?.length || 0
        };

        Matrix.checkValidity(matrix);
        return matrix;
    },

    checkValidity(matrix) {
        const { data } = matrix;
        if (!Array.isArray(data)) {
            throw new Error("Matrix must be a list.");
        }

        for (let i = 0; i < data.length; i++) {
            if (!Array.isArray(data[i])) {
                throw new Error("Rows must be arrays.");
            }
            if (data[i].length !== data[0].length) {
                throw new Error("Rows must be equal in length.");
            }
        }
    },

    getColumn(matrix, index) {
        if (index >= matrix.cols) {
            throw new Error(`Column index ${index} out of range.`);
        }
        return matrix.data.map(row => row[index]);
    },

    checkZeros(matrix, index) {
        if (index >= matrix.rows) {
            throw new Error("Index out of range.");
        }
        return matrix.data[index].every(el => Math.abs(el) < 1e-10);
    },

    sumRows(matrix, index1, index2, multiple) {
        if (!Number.isFinite(multiple)) {
            throw new Error("Not a valid multiple.");
        }
        if (index1 >= matrix.rows || index2 >= matrix.rows) {
            throw new Error(`Row index out of range.`);
        }

        const row1 = matrix.data[index1];
        const row2 = matrix.data[index2];
        return row2.map((value, i) => multiple * row1[i] + value);
    },

    switchRows(matrix, index1, index2) {
        if (index1 >= matrix.rows || index2 >= matrix.rows) {
            throw new Error("Index out of range.");
        }
        const newData = structuredClone(matrix.data);
        [newData[index1], newData[index2]] = [newData[index2], newData[index1]];
        return Matrix.create(newData);
    },

    scalarVectorProduct(vec, multiple) {
        if (Array.isArray(vec)) {
            return vec.map(val => val * multiple);
        } else {
            throw new Error("Not a valid vector.");
        }
    },

    clone(matrix) {
        return Matrix.create(structuredClone(matrix.data));
    },

    // TODO: send components instead of html.
    // Or at least map action types to components elsewhere. (OperationDisplay.jsx)

    *elimination(matrix, augmentedVector = null, jordan = true) {
        // TODO: change phase from always being rref to `mode` instead or possibly `elimination`
        const mode = jordan ? 'rref' : 'ref';
        const modeName = jordan ? 'Reduced Row Echelon Form (RREF)' : 'Row Echelon Form (REF)';
        const processName = jordan ? 'Gauss-Jordan Elimination' : 'Gaussian Elimination';

        let currentMatrix = Matrix.clone(matrix);
        let aug = augmentedVector ? [...augmentedVector] : null;
        const pivotCols = [];
        let nextPivotRow = 0;
        const pivots = [];


        yield {
            phase: 'rref',
            action: 'start',
            description: `Starting ${processName} to transform the matrix to ${modeName}.${jordan ? ` We'll use a two-phase approach:<br>
            <strong>Phase 1:</strong> Forward elimination to get Row Echelon Form (REF)<br>
            <strong>Phase 2:</strong> Back elimination to get Reduced Row Echelon Form (RREF)` :
                `<br>We'll perform forward elimination only to reach Row Echelon Form (REF).`
                }`,
            matrix: structuredClone(currentMatrix.data),
            pivotCols: [...pivotCols],
            augmentedVector: aug ? [...aug] : null,
            pivots: structuredClone(pivots),
        };

        // PHASE 1: Forward elimination to REF
        yield {
            phase: 'rref',
            action: 'gauss_start',
            description: `
                <p><strong>${jordan ? 'PHASE 1: ' : ''} Forward Elimination to Row Echelon Form (REF)</strong></p>
                <p>In this ${jordan ? 'phase' : 'process'}, we'll:</p>
                <ul>
                    <li>Find pivots from left to right</li>
                    <li>Swap rows to bring pivots to diagonal positions</li>
                    <li>Scale pivots to 1</li>
                    <li>Eliminate entries <strong>below</strong> each pivot only</li>
                </ul>
                <p>This will give us the "staircase" form where each pivot has zeros below it.</p>
                ${jordan
                    ? '<p><em>After this phase, we will continue to back elimination to reach RREF.</em>'
                    : '<p><em>This completes the Gaussian Elimination process.</em>'
                }
            `,
            matrix: structuredClone(currentMatrix.data),
            pivotCols: [...pivotCols],
            augmentedVector: aug ? [...aug] : null,
            pivots: structuredClone(pivots),
        };

        // Iterate over each column. The actual start of phase 1 (Gauss).
        for (let j = 0; j < currentMatrix.cols; j++) {

            // If no rows left => break. All pivots were found.
            if (nextPivotRow >= currentMatrix.rows) {
                yield {
                    phase: 'rref',
                    action: 'no_more_rows',
                    description: `
                        no rows left. terminating gauss elimination... (this's a placeholder!!!!! remember to add an actual message)
                    `,
                    matrix: structuredClone(currentMatrix.data),
                    pivotCols: [...pivotCols],
                    augmentedVector: aug ? [...aug] : null,
                    currentColumn: j,
                    searchStart: nextPivotRow,
                    pivots: structuredClone(pivots),
                };
                break;
            }

            yield {
                phase: 'rref',
                action: 'search_pivot',
                description: `
                    <p><strong>Searching for pivot in column ${j + 1}</strong></p>
                    <p>Looking for the first non-zero entry in column ${j + 1}, starting from row ${nextPivotRow + 1} downward. 
                    ${nextPivotRow > 0 ? `We skip rows above ${nextPivotRow + 1} because they already have pivots in previous columns.</p>` : ""}
                `,
                matrix: structuredClone(currentMatrix.data),
                pivotCols: [...pivotCols],
                augmentedVector: aug ? [...aug] : null,
                currentColumn: j,
                searchStart: nextPivotRow,
                pivots: structuredClone(pivots),
            };

            // Searching for a pivot
            let searchDetails = [];
            let pivotRow = null;
            const details = {
                nonZero: {},
                one: {},
                negativeOne: {}
            };

            // Searching for pivot
            for (let i = nextPivotRow; i < currentMatrix.rows; i++) {
                const value = currentMatrix.data[i][j];
                searchDetails.push(`Row ${i + 1}: ${formatNumber(value)}`);

                // Best case: value is 1; immediate pivot
                if (Math.abs(value - 1) < 1e-10 && details.one.x === undefined) {
                    details.one = { value, x: i, y: j };
                    break; // stop searching
                }

                // Next best: value is -1; store it, but keep looking for a 1
                else if (Math.abs(value + 1) < 1e-10 && details.negativeOne.x === undefined) {
                    details.negativeOne = { value, x: i, y: j };
                }

                // Otherwise, store first non-zero
                else if (Math.abs(value) > 1e-10 && details.nonZero.x === undefined) {
                    details.nonZero = { value, x: i, y: j };
                }
            }

            // Found a 1. Perfect pivot.
            if (details.one.x !== undefined) {
                const { x: row, y: col } = details.one;
                pivotRow = row;
                pivotCols.push(col);
                const pivotPosition = { row, col };
                pivots.push(pivotPosition);

                yield {
                    phase: 'rref',
                    action: 'perfect_pivot_found',
                    description: `
                        <p><strong>Ideal Pivot Found (1)</strong></p>
                        <p>In column ${j + 1}, we found a <strong>perfect pivot</strong> at position (${row + 1}, ${col + 1}).</p>
                        <p>Since it's already 1, we can avoid division and keep calculations simpler (no fractions introduced).</p>
                        <p>We'll bring this row up to the pivot position (${nextPivotRow + 1}) if necessary.</p>
                        <p><strong>Search details:</strong></p>
                        ${searchDetails.map((detail, idx) =>
                        idx === row - nextPivotRow
                            ? `- ${detail} ← <strong>SELECTED AS PERFECT PIVOT</strong>`
                            : `• ${detail}`
                    ).join('<br>')}
                    `,
                    matrix: structuredClone(currentMatrix.data),
                    pivotCols: [...pivotCols],
                    augmentedVector: aug ? [...aug] : null,
                    pivotPosition,
                    pivots: structuredClone(pivots),
                };
            }

            // Found a -1. Second best pivot.
            else if (details.negativeOne.x !== undefined) {
                const { x: row, y: col, value } = details.negativeOne;
                pivotRow = row;
                pivotCols.push(col);
                const pivotPosition = { row, col };
                pivots.push(pivotPosition);

                yield {
                    phase: 'rref',
                    // TODO: add corresponding name
                    action: 'negative_pivot_found',
                    description: `
                        <p><strong>Convenient Pivot Found (-1)</strong></p>
                        <p>Found a pivot candidate of -1 at position (${row + 1}, ${col + 1}).</p>
                        <p>This is almost as good as 1 since we can simply multiply the row by -1 instead of dividing by a messy number.</p>
                        <p>We'll simply bring this row to the pivot position (${nextPivotRow + 1}) and flip its sign.</p>
                        <p><strong>Search details:</strong></p>
                        ${searchDetails.map((detail, idx) =>
                        idx === row - nextPivotRow
                            ? `- ${detail} ← <strong>SELECTED AS PIVOT (-1)</strong>`
                            : `• ${detail}`
                    ).join('<br>')}
                    `,
                    matrix: structuredClone(currentMatrix.data),
                    pivotCols: [...pivotCols],
                    augmentedVector: aug ? [...aug] : null,
                    pivotPosition,
                    pivots: structuredClone(pivots),
                };
            }

            // Found a nonzero. The only choice at this point.
            else if (details.nonZero.x !== undefined) {
                const { x: row, y: col, value } = details.nonZero;
                pivotRow = row;
                pivotCols.push(col);
                const pivotPosition = { row, col };
                pivots.push(pivotPosition);

                yield {
                    phase: 'rref',
                    action: 'pivot_found',
                    description: `
                        <p><strong>Pivot Found</strong></p>
                        <p>Found first non-zero entry at position (${row + 1}, ${col + 1}) with value ${formatNumber(value)}.</p>
                        <p><strong>Search details:</strong></p>
                        ${searchDetails.map((detail, idx) =>
                        idx === row - nextPivotRow
                            ? `- ${detail} ← <strong>SELECTED AS PIVOT</strong>`
                            : `• ${detail}`
                    ).join('<br>')}
                    `,
                    matrix: structuredClone(currentMatrix.data),
                    pivotCols: [...pivotCols],
                    augmentedVector: aug ? [...aug] : null,
                    pivotPosition,
                    pivots: structuredClone(pivots),
                };
            }

            // No pivot found.
            else {
                yield {
                    phase: 'rref',
                    action: 'no_pivot_detailed',
                    description: `
                        <p><strong>No Pivot Found in Column ${j + 1}</strong></p>
                        ${searchDetails.length !== 0
                            ? `<p><strong>Search Process:</strong></p>
                            ${searchDetails.map(detail => `• ${detail}`).join('<br>')}`
                            : ""}
                        <p><strong>Why this matters:</strong></p>
                        <ul>
                            <li>All entries in column ${j + 1} from row ${nextPivotRow + 1} downward are zero</li>
                            <li>This means variable x<sub>${j + 1}</sub> will be a <strong>free variable</strong></li>
                            <li>Free variables can take any value in the solution</li>
                            <li>The system may have infinitely many solutions</li>
                        </ul>
                        <p>We'll continue to the next column without increasing the pivot row counter.</p>
                    `,
                    matrix: structuredClone(currentMatrix.data),
                    pivotCols: [...pivotCols],
                    augmentedVector: aug ? [...aug] : null,
                    searchDetails,
                    pivots: structuredClone(pivots),
                };
            }

            // If pivot found: swapping, scaling, and elimination are done here.
            if (pivotRow !== null) {
                // Swap needed
                if (pivotRow !== nextPivotRow) {
                    yield {
                        phase: 'rref',
                        action: 'swap_needed',
                        description: `
                <p><strong>Row Swap Required</strong></p>
                <p>The pivot at (${pivotRow + 1}, ${j + 1}) is not in the current pivot row ${nextPivotRow + 1}. 
                For proper echelon form, pivots must move down and to the right.</p>
                <p>Swapping row ${pivotRow + 1} with row ${nextPivotRow + 1} to bring the pivot to the correct position.</p>
            `,
                        matrix: structuredClone(currentMatrix.data),
                        pivotCols: [...pivotCols],
                        augmentedVector: aug ? [...aug] : null,
                        pivots: structuredClone(pivots),
                    };

                    currentMatrix = Matrix.switchRows(currentMatrix, pivotRow, nextPivotRow);
                    if (aug) [aug[pivotRow], aug[nextPivotRow]] = [aug[nextPivotRow], aug[pivotRow]];

                    const pivotIndex = pivots.findIndex(p => p.row === pivotRow && p.col === j);
                    if (pivotIndex !== -1) {
                        pivots[pivotIndex].row = nextPivotRow;
                    }

                    yield {
                        phase: 'rref',
                        action: 'swap',
                        description: `
                <p><strong>Rows Swapped Successfully</strong></p>
                <p>Row ${pivotRow + 1} and Row ${nextPivotRow + 1} have been swapped.</p>
                <p>The pivot is now at position (${nextPivotRow + 1}, ${j + 1}).</p>
            `,
                        matrix: structuredClone(currentMatrix.data),
                        pivotCols: [...pivotCols],
                        augmentedVector: aug ? [...aug] : null,
                        pivots: structuredClone(pivots)
                    };
                }
                // Correct position
                else {
                    yield {
                        phase: 'rref',
                        action: 'pivot_correct_position',
                        description: `
                <p><strong>Pivot in Correct Position</strong></p>
                <p>The pivot at (${pivotRow + 1}, ${j + 1}) is in the current pivot row ${nextPivotRow + 1}. No row swap needed.</p>
            `,
                        matrix: structuredClone(currentMatrix.data),
                        pivotCols: [...pivotCols],
                        augmentedVector: aug ? [...aug] : null,
                        pivots: structuredClone(pivots),
                    };
                }

                const currentPivot = currentMatrix.data[nextPivotRow][j];
                // Not equal to one; scaling needed.
                if (Math.abs(currentPivot - 1) > 1e-10) {
                    const scale = 1 / currentPivot;

                    yield {
                        phase: 'rref',
                        action: 'scale_explanation',
                        description: `
                            <p><strong>Scaling Pivot Row</strong></p>
                            <p>To make the pivot equal to 1 (required for RREF), we'll scale row ${nextPivotRow + 1} by the reciprocal of the pivot value.</p>
                            <p><strong>Calculation:</strong> Scale factor = 1 / ${formatNumber(currentPivot)} = ${formatNumber(scale)}</p>
                            <p>We'll multiply every element in row ${nextPivotRow + 1} by ${formatNumber(scale)}.</p>
                        `,
                        matrix: structuredClone(currentMatrix.data),
                        pivotCols: [...pivotCols],
                        augmentedVector: aug ? [...aug] : null,
                        pivots: structuredClone(pivots),
                    };

                    currentMatrix.data[nextPivotRow] = Matrix.scalarVectorProduct(
                        currentMatrix.data[nextPivotRow],
                        scale
                    );
                    if (aug) aug[nextPivotRow] *= scale;

                    yield {
                        phase: 'rref',
                        action: 'scale',
                        description: `
                            <p><strong>Row Scaled Successfully</strong></p>
                            <p>Row ${nextPivotRow + 1} has been multiplied by ${formatNumber(scale)}.</p>
                            <p>The pivot at (${nextPivotRow + 1}, ${j + 1}) is now exactly 1.</p>
                        `,
                        matrix: structuredClone(currentMatrix.data),
                        pivotCols: [...pivotCols],
                        augmentedVector: aug ? [...aug] : null,
                        pivots: structuredClone(pivots),
                    };
                }
                // Equal to one; no scaling needed.
                else {
                    yield {
                        phase: 'rref',
                        action: 'pivot_already_one',
                        description: `
                            <p><strong>Pivot Already Equal to 1</strong></p>
                            <p>The pivot at (${nextPivotRow + 1}, ${j + 1}) is already 1. No scaling needed.</p>
                        `,
                        matrix: structuredClone(currentMatrix.data),
                        pivotCols: [...pivotCols],
                        augmentedVector: aug ? [...aug] : null,
                        pivots: structuredClone(pivots),
                    };
                }

                // PHASE 1: Eliminate only BELOW the pivot
                let eliminationSteps = [];

                for (let i = nextPivotRow + 1; i < currentMatrix.rows; i++) {
                    if (Math.abs(currentMatrix.data[i][j]) > 1e-10) {
                        const targetValue = currentMatrix.data[i][j];
                        const factor = -targetValue;

                        eliminationSteps.push({ row: i, targetValue, factor });

                        yield {
                            phase: 'rref',
                            action: 'eliminate_explanation',
                            description: `
                                <p><strong>Eliminating Entry Below Pivot</strong></p>
                                <p>We need to eliminate the value ${formatNumber(targetValue)} at position (${i + 1}, ${j + 1}).</p>
                                <p>Row ${i + 1} → Row ${i + 1} + (${formatNumber(factor)}) × Row ${nextPivotRow + 1}</p>
                                <p>This works because: ${formatNumber(targetValue)} + (${formatNumber(factor)} × 1) = 0</p>
                                <p><em>Note: In Gaussian Elimination, we only eliminate entries below the pivot.</em></p>
                            `,
                            matrix: structuredClone(currentMatrix.data),
                            pivotCols: [...pivotCols],
                            augmentedVector: aug ? [...aug] : null,
                            targetPosition: { row: i, col: j },
                            pivots: structuredClone(pivots),
                        };

                        currentMatrix.data[i] = Matrix.sumRows(currentMatrix, nextPivotRow, i, factor);
                        if (aug) aug[i] += factor * aug[nextPivotRow];

                        yield {
                            phase: 'rref',
                            action: 'eliminate',
                            description: `
                                <p><strong>Entry Eliminated Successfully</strong></p>
                                <p>Applied: Row ${i + 1} → Row ${i + 1} + (${formatNumber(factor)}) × Row ${nextPivotRow + 1}</p>
                                <p>The entry at (${i + 1}, ${j + 1}) is now zero.</p>
                            `,
                            matrix: structuredClone(currentMatrix.data),
                            pivotCols: [...pivotCols],
                            augmentedVector: aug ? [...aug] : null,
                            pivots: structuredClone(pivots)
                        };
                    }
                }

                // No elimination needed
                if (eliminationSteps.length === 0) {
                    yield {
                        phase: 'rref',
                        action: 'no_elimination_needed',
                        description: `
                            <p><strong>No Elimination Needed Below Pivot</strong></p>
                            <p>All entries below the pivot at (${nextPivotRow + 1}, ${j + 1}) are already zero.</p>
                        `,
                        matrix: structuredClone(currentMatrix.data),
                        pivotCols: [...pivotCols],
                        augmentedVector: aug ? [...aug] : null,
                        pivots: structuredClone(pivots),
                    };
                }

                // Gauss complete for current pivot.
                yield {
                    phase: 'rref',
                    action: 'pivot_forward_complete',
                    description: `
            <p><strong>Forward elimination Complete for Column ${j + 1}!</strong></p>
            <p>Column ${j + 1} is now processed${jordan ? ' in Phase 1' : ''}.</p>
            <ul>
                <li>The pivot is 1 at position (${nextPivotRow + 1}, ${j + 1})</li>
                <li>All entries below the pivot are zero</li>
                ${jordan ? '<li>Entries above the pivot will be handled in Phase 2</li>' : ''}
            </ul>
        `,
                    matrix: structuredClone(currentMatrix.data),
                    pivotCols: [...pivotCols],
                    augmentedVector: aug ? [...aug] : null,
                    pivots: structuredClone(pivots),
                };

                nextPivotRow++;
            }

            // If no pivot found, nothing happens. Just search the next column.
        }

        const numFreeCols = currentMatrix.cols - pivotCols.length;

        // Conditionally skip phase 2
        if (!jordan) {
            yield {
                phase: 'rref',
                action: 'final',
                description: `
                    <p><strong>Matrix Successfully Reduced to Row Echelon Form (REF)</strong></p>
                    <p><strong>Summary:</strong></p>
                    <ul>
                        <li>Found ${pivotCols.length} pivot columns: ${pivotCols.map(col => col + 1).join(', ')}</li>
                        <li>Matrix rank = ${pivotCols.length}</li>
                        <li>${numFreeCols} free variable${numFreeCols !== 1 ? 's' : ""}</li>
                    </ul>
                    <p><strong>Process Completed:</strong></p>
                    <ul>
                        <li>Performed forward elimination (Gaussian elimination)</li>
                        <li>All pivots are 1 and positioned in staircase form</li>
                        <li>All entries <strong>below</strong> each pivot are zero</li>
                    </ul>
                    <p>The matrix now satisfies all <strong>Row Echelon Form (REF)</strong> conditions:</p>
                    <ol>
                        <li>All nonzero rows are above any rows of all zeros</li>
                        <li>Each pivot (leading 1) appears to the right of the pivot above it</li>
                        <li>All entries below each pivot are zero</li>
                    </ol>
                    <p>You can stop here or continue to <strong>back elimination</strong> to reach <strong>Reduced Row Echelon Form (RREF)</strong>.</p>
                `,
                matrix: structuredClone(currentMatrix.data),
                pivotCols: [...pivotCols],
                augmentedVector: aug ? [...aug] : null,
                rank: pivotCols.length,
                freeVariables: currentMatrix.cols - pivotCols.length,
                pivots: structuredClone(pivots)
            };
            return;
        }

        // PHASE 2: Back elimination to get RREF
        yield {
            phase: 'rref',
            action: 'gauss_jordan_start',
            description: `
                <p><strong>PHASE 2: Back elimination to RREF</strong></p>
                <p>In this phase, we'll:</p>
                <ul>
                    <li>Work from the bottom-right pivot upward</li>
                    <li>Eliminate entries <strong>above</strong> each pivot</li>
                    <li>This will create zeros above each pivot, completing the RREF</li>
                </ul>
            `,
            matrix: structuredClone(currentMatrix.data),
            pivotCols: [...pivotCols],
            augmentedVector: aug ? [...aug] : null,
            pivots: structuredClone(pivots),
        };

        // Process pivots from bottom to top
        for (let p = pivots.length - 1; p >= 0; p--) {
            const pivot = pivots[p];
            const pivotRow = pivot.row;
            const pivotCol = pivot.col;

            yield {
                phase: 'rref',
                action: 'back_substitute_start',
                description: `
                    <p><strong>Processing Pivot at (${pivotRow + 1}, ${pivotCol + 1}) in Phase 2</strong></p>
                    <p>We'll now eliminate all entries above this pivot to complete column ${pivotCol + 1}.</p>
                    <p>Working from the bottom up ensures we don't disturb previously cleared columns.</p>
                `,
                matrix: structuredClone(currentMatrix.data),
                pivotCols: [...pivotCols],
                augmentedVector: aug ? [...aug] : null,
                pivots: structuredClone(pivots),
                currentPivot: pivot,
            };

            let eliminationSteps = [];

            // Eliminate above the current pivot
            for (let i = 0; i < pivotRow; i++) {

                // If non zero, eliminate.
                if (Math.abs(currentMatrix.data[i][pivotCol]) > 1e-10) {
                    const targetValue = currentMatrix.data[i][pivotCol];
                    const factor = -targetValue;

                    eliminationSteps.push({ row: i, targetValue, factor });

                    yield {
                        phase: 'rref',
                        action: 'eliminate_above_explanation',
                        description: `
                            <p><strong>Eliminating Entry Above Pivot</strong></p>
                            <p>We need to eliminate the value ${formatNumber(targetValue)} at position (${i + 1}, ${pivotCol + 1}).</p>
                            <p>Row ${i + 1} → Row ${i + 1} + (${formatNumber(factor)}) × Row ${pivotRow + 1}</p>
                            <p>This works because: ${formatNumber(targetValue)} + (${formatNumber(factor)} × 1) = 0</p>
                            <p><em>Note: In Phase 2, we only eliminate entries above the pivot.</em></p>
                        `,
                        matrix: structuredClone(currentMatrix.data),
                        pivotCols: [...pivotCols],
                        augmentedVector: aug ? [...aug] : null,
                        targetPosition: { row: i, col: pivotCol },
                        pivots: structuredClone(pivots),
                    };

                    currentMatrix.data[i] = Matrix.sumRows(currentMatrix, pivotRow, i, factor);
                    if (aug) aug[i] += factor * aug[pivotRow];

                    yield {
                        phase: 'rref',
                        action: 'eliminate_above',
                        description: `
                            <p><strong>Entry Above Eliminated Successfully</strong></p>
                            <p>Applied: Row ${i + 1} → Row ${i + 1} + (${formatNumber(factor)}) × Row ${pivotRow + 1}</p>
                            <p>The entry at (${i + 1}, ${pivotCol + 1}) is now zero.</p>
                        `,
                        matrix: structuredClone(currentMatrix.data),
                        pivotCols: [...pivotCols],
                        augmentedVector: aug ? [...aug] : null,
                        pivots: structuredClone(pivots)
                    };
                }

                // If zero, do nothing.
            }

            // No elimination needed.
            if (eliminationSteps.length === 0) {
                yield {
                    phase: 'rref',
                    action: 'no_elimination_above_needed',
                    description: `
                        <p><strong>No Elimination Needed Above Pivot</strong></p>
                        ${pivotRow > 0 ? `<p>All entries above the pivot at (${pivotRow + 1}, ${pivotCol + 1}) are already zero.</p>` : "<p>This is the first row, so there are no entries above the pivot.</p>"}
                    `,
                    matrix: structuredClone(currentMatrix.data),
                    pivotCols: [...pivotCols],
                    augmentedVector: aug ? [...aug] : null,
                    pivots: structuredClone(pivots),
                };
            }

            // Pivot done.
            yield {
                phase: 'rref',
                action: 'pivot_phase2_complete',
                description: `
                    <p><strong>Phase 2 Complete for Pivot at (${pivotRow + 1}, ${pivotCol + 1})!</strong></p>
                    <p>Column ${pivotCol + 1} is now fully processed.</p>
                    <ul>
                        <li>The pivot is 1</li>
                        <li>All entries below the pivot are zero</li>
                        <li>All entries above the pivot are zero</li>
                        <li>This column is now in perfect RREF form</li>
                    </ul>
                `,
                matrix: structuredClone(currentMatrix.data),
                pivotCols: [...pivotCols],
                augmentedVector: aug ? [...aug] : null,
                pivots: structuredClone(pivots),
            };
        }

        // Done.
        yield {
            phase: 'rref',
            action: 'final',
            description: `
                <p><strong>Matrix Successfully Reduced to RREF</strong></p>
                <p><strong>Summary:</strong></p>
                <ul>
                    <li>Found ${pivotCols.length} pivot columns: ${pivotCols.map(col => col + 1).join(', ')}</li>
                    <li>Matrix rank = ${pivotCols.length}</li>
                    <li>${numFreeCols} free variable${numFreeCols !== 1 ? 's' : ""}</li>
                </ul>
                <p><strong>Two-Phase Process Completed:</strong></p>
                <ol>
                    <li><strong>Phase 1:</strong> Forward elimination to Row Echelon Form</li>
                    <li><strong>Phase 2:</strong> Back elimination to Reduced Row Echelon Form</li>
                </ol>
                <p>The matrix now satisfies all RREF conditions:</p>
                <ol>
                    <li>All zero rows are at the bottom</li>
                    <li>Each pivot is 1 and is the only non-zero in its column</li>
                    <li>Pivots move down and to the right</li>
                    <li>Each pivot is to the right of the pivot above it</li>
                </ol>
            `,
            matrix: structuredClone(currentMatrix.data),
            pivotCols: [...pivotCols],
            augmentedVector: aug ? [...aug] : null,
            rank: pivotCols.length,
            freeVariables: currentMatrix.cols - pivotCols.length,
            pivots: structuredClone(pivots)
        };
    },

    *solveSystemSteps(matrix, solutionVector) {
        // Show RREF steps first
        for (const step of Matrix.elimination(matrix, solutionVector, true)) {
            yield step;
        }

        const finalRREF = Matrix.rref(matrix, solutionVector);
        const { pivotCols, augmentedVector: b } = finalRREF;
        const rankA = pivotCols.length;

        let rankAb = rankA;
        let hasContradiction = false;
        let contradictionRow = -1;
        const zeroRowsAnalysis = [];

        yield {
            phase: 'analysis',
            type: 'ready_to_solve',
            description: `System Ready for Solution`,
            details: [
                `• We have now transformed the augmented matrix into its <strong>Reduced Row Echelon Form (RREF)</strong>.<br>`,
                `• This form clearly shows the pivot positions and simplifies the equations, making it straightforward to determine whether the system has a unique solution, infinitely many solutions, or no solution.<br>`,
                `• Now we're ready to proceed with solving the system.`
            ],
            matrix: finalRREF.rref.data,
            pivotCols,
            augmentedVector: b,
        };

        yield {
            phase: 'analysis',
            type: 'rank_explanation',
            description: `The meaning of rank`,
            details: [
                `• <strong>Rank of a matrix</strong> = number of pivot columns = number of linearly independent rows/columns`,
                `• <strong>Rank tells us about the number of solutions to a system of equations</strong>`
            ],
            matrix: finalRREF.rref.data,
            pivotCols,
            augmentedVector: b,
        };

        if (b) {
            // If rank != number of rows, there could be 0 = c rows (contradiction).
            // This happens when the rows at the bottom of the matrix (always zero rows)
            // have corresponding non-zero entries in the rref'd solution vector.
            for (let i = rankA; i < matrix.rows; i++) {
                const value = b[i];
                const isNonZero = Math.abs(value) > 1e-10;
                zeroRowsAnalysis.push({
                    row: i,
                    value: value,
                    isNonZero: isNonZero,
                    equation: `0 = ${formatNumber(value)}`,
                    status: isNonZero ? 'CONTRADICTION' : 'CONSISTENT'
                });

                if (isNonZero && !hasContradiction) {
                    hasContradiction = true;
                    contradictionRow = i;
                    rankAb = rankA + 1;
                }
            }
        }

        // Calculate rank
        yield {
            phase: 'analysis',
            type: 'rank_ab_calculation',
            description: `<strong>Calculating Rank of Augmented Matrix [A|b]</strong>`,
            details: [
                `We already know rank(A) = ${rankA} (number of pivot columns).`,
                `To find rank([A|b]), we check if any rows became zero rows after the final pivot row in the coefficient matrix:<br>`,
                ...(zeroRowsAnalysis.length > 0
                    ? zeroRowsAnalysis.map(check =>
                        `Row ${check.row + 1}: [${'0, '.repeat(matrix.cols).slice(0, -2)} | ${formatNumber(check.value)}] → ${check.equation} → <strong>${check.status}</strong>`
                    )
                    : ["Observation: the coefficient matrix has no zero rows."]
                )
            ],
            ourCase: hasContradiction
                // NOTE: contradictionRow is 0-indexed
                ? `Found contradiction in row ${contradictionRow + 1}! This creates an extra pivot, so rank([A|b]) = rank(A) + 1 = ${rankAb}`
                : `No inconsistent zero rows (0 = a number). No extra pivots. So rank([A|b]) = rank(A) = ${rankAb}`,
            matrix: finalRREF.rref.data,
            pivotCols,
            augmentedVector: b,
            ranks: { rankA, rankAb, hasContradiction, contradictionRow }
        };

        // Use rank to find the number of solutions
        yield {
            phase: 'analysis',
            type: 'theorem_explanation',
            description: `Now let's find the number of solutionzs`,
            cases: [
                `• If rank(A) = rank([A|b]) = n → <strong>Unique Solution</strong>`,
                `• If rank(A) = rank([A|b]) < n → <strong>Infinite Solutions</strong>`,
                `• If rank(A) < rank([A|b]) → <strong>No Solution</strong>`
            ],
            ourCase: `In our case: rank(A) = ${rankA}, rank([A|b]) = ${rankAb}, n = ${matrix.cols}`,
            matrix: finalRREF.rref.data,
            pivotCols,
            augmentedVector: b
        };

        // Unique solution
        if (rankA === rankAb && rankA === matrix.cols) {
            yield {
                phase: 'analysis',
                type: 'solution_type_determined',
                description: `System has a <strong>unique solution</strong>`,
                reasoning: [
                    `• rank(A) = rank([A|b]) = ${rankA}`,
                    `• rank equals number of variables (n = ${matrix.cols})`,
                    `• No free variables → Exactly one solution`
                ],
                matrix: finalRREF.rref.data,
                pivotCols,
                augmentedVector: b
            };

            // Extract unique solution by just equalling each pivot variable to its corresponding value in the solution vector.
            const solution = new Array(matrix.cols).fill(0); // Initialize an array of 0s
            const solutionSteps = []; // To display
            for (let i = 0; i < rankA; i++) {
                const pivotCol = pivotCols[i];
                solution[pivotCol] = b[i];
                solutionSteps.push(`x<sub>${pivotCol + 1}</sub> = ${formatNumber(b[i])} (from row ${i + 1})`);
            }

            yield {
                phase: 'solution',
                type: 'unique_solution_values',
                description: `Solution values`,
                steps: solutionSteps,
                solution: solution,
                finalExplanation: `Each pivot variable gets its value from the corresponding entry in the augmented vector.`,
                matrix: finalRREF.rref.data,
                pivotCols,
                augmentedVector: b
            };
        }

        // Infinite solutions
        else if (rankA === rankAb && rankA < matrix.cols) {

            // Collect free columns
            const freeCols = [];
            for (let i = 0; i < matrix.cols; i++) {
                if (!pivotCols.includes(i)) freeCols.push(i);
            }

            yield {
                phase: 'analysis',
                type: 'solution_type_determined',
                description: `System has <strong>infinite solutions</strong>`,
                reasoning: [
                    `• rank(A) = rank([A|b]) = ${rankA}`,
                    `• rank < number of variables (${rankA} < ${matrix.cols})`,
                    `• There ${freeCols?.length === 1 ? "is" : "are"} ${freeCols.length} free variable${freeCols.length !== 1 ? 's' : ''} → Infinite solutions`,
                    `• <i>Note: Free variables are the variables not corresponding to a pivot column</i>`,
                    `Free Variables: ${freeCols.map((col, index) => (
                        `
                        <strong key={col}>
                            x<sub>${col + 1}</sub>
                            ${index < freeCols.length - 1 ? ', ' : ''}
                        </strong>
                        `
                    ))}
                `,

                ],
                matrix: finalRREF.rref.data,
                pivotCols,
                augmentedVector: b,
                freeCols,
                freeVars: true,
            };

            yield {
                phase: 'solution',
                type: 'extracting_equations',
                description: `Extracting Equations from RREF`,
                details: [
                    `Each row gives us an equation for a basic variable in terms of free variables.`,
                ],
                matrix: finalRREF.rref.data,
                pivotCols,
                augmentedVector: b,
                freeCols,
                freeVars: true,
            };

            // Form the equations
            const equations = [];

            // There are pivot variables of count `rankA`. Hence `rankA` equations.
            for (let i = 0; i < rankA; i++) {
                const row = finalRREF.rref.data[i];
                const pivotCol = pivotCols[i];
                const equation = {
                    basicVar: `x<sub>${pivotCol + 1}</sub>`,
                    terms: [],
                    rowIndex: i,
                    constant: b[i]
                };

                let equationText = `x<sub>${pivotCol + 1}</sub> = `;

                // If solution vector's corresponding value is non zero, push it first.
                if (Math.abs(b[i]) > 1e-10) {
                    equationText += formatNumber(b[i]);
                }

                // Iterate over all columns to form the equation
                for (let j = 0; j < matrix.cols; j++) {
                    // Only proceed if free column and non-zero
                    if (freeCols.includes(j) && Math.abs(row[j]) > 1e-10) {
                        const coeff = -row[j];
                        equation.terms.push({
                            coeff: coeff,
                            freeVar: `x<sub>${j + 1}</sub>`
                        });

                        // Check whether to place + or not. Doesn't place if there are no solution vector variables.
                        if (equationText.includes('=') && equationText !== `x<sub>${pivotCol + 1}</sub> = `) {
                            equationText += ' + ';
                        }

                        // If coefficient equals 1, no need to place it. 
                        if (coeff === 1) {
                            equationText += `x<sub>${j + 1}</sub>`;
                        }

                        // If -1, just place a negative sign.
                        else if (coeff === -1) {
                            equationText += `-x<sub>${j + 1}</sub>`;
                        }

                        // Otherwise place the coefficient.
                        else {
                            equationText += `${formatNumber(coeff)}x<sub>${j + 1}</sub>`;
                        }
                    }
                }

                // If no free cols and no solution vector variable, it's just "x = ".
                // Append a 0 in that case.
                if (equationText === `x<sub>${pivotCol + 1}</sub> = `) {
                    equationText += '0';
                }

                equations.push({ ...equation, display: equationText });

                yield {
                    phase: 'solution',
                    type: 'equation_extracted',
                    description: `Equation from Row ${i + 1}`,
                    details: [
                        `Reading from row ${i + 1} of the RREF matrix:`,
                        `<br><strong>${equationText}</strong><br>`,
                        `<br>This tells us how the basic variable x<sub>${pivotCol + 1}</sub> depends on the free variables.`,
                    ],
                    matrix: finalRREF.rref.data,
                    pivotCols,
                    augmentedVector: b,
                    equation: equationText,
                    rowIndex: i
                };
            }



            // TODO: refactor this.
            // Currently using the x = xp + c1v1 + c2v2 + ... method
            // Just change the form of the equations in the previous step and use them here.
            // I'll also need to change the interface in the solutiondisplay file


            // => START

            // Prepare the particular solution vector
            const xp = new Array(matrix.cols).fill(0);

            // Find the particular solution by setting each pivot variable to its corresponding solution vector value
            // and the free variables are left 0 by default.
            for (let i = 0; i < rankA; i++) {
                const pivotCol = pivotCols[i];
                xp[pivotCol] = b[i];
            }

            const basisVectors = [];

            // Iterate over free variables
            for (let i = 0; i < freeCols.length; i++) {
                // For each basis vector, a free variable is 1, the rest are 0, and the pivot variable is calculated using the equation
                // formed from those 0s and 1.
                const freeVarIndex = freeCols[i];
                const basisVector = new Array(matrix.cols).fill(0);
                basisVector[freeVarIndex] = 1; // Set this vector's free variable's value to 1

                // Solve for pivot variables using the equations.
                // Start from `rankA - 1` to skip the possible zero rows since we're in the infinite solution step after all.
                for (let row = rankA - 1; row >= 0; row--) {
                    const pivotCol = pivotCols[row]; // Get the pivot column of the current row
                    let sum = 0;

                    for (let j = pivotCol + 1; j < matrix.cols; j++) {
                        // multiply by the basis vector's value at each index
                        // because it describes each variable's coefficient at these points
                        sum += finalRREF.rref.data[row][j] * basisVector[j];
                    }

                    basisVector[pivotCol] = -sum; // Negative because it's moved to the other side of the equation.
                }

                basisVectors.push(basisVector);
            }

            yield {
                phase: 'solution',
                type: 'infinite_solutions_general',
                description: 'General Solution',
                matrix: finalRREF.rref.data,
                pivotCols,
                rank: rankA,
                freeVars: freeCols,
                constants: b,
                variables: matrix.cols,
                particularSolution: xp,
                basisVectors: basisVectors,
                equations: equations,
                augmentedVector: b
            };
            // <= END
        }

        // No solution
        else {
            yield {
                phase: 'analysis',
                type: 'no_solution',
                description: `System has <strong>no solution</strong>`,
                reasoning: [
                    `rank(A) = ${rankA}`,
                    `rank([A|b]) = ${rankAb}`,
                    `Since rank(A) < rank([A|b]), the system is inconsistent`
                ],
                explanation: `The augmented matrix has more independent equations than the coefficient matrix, meaning the system is overdetermined and inconsistent.`,
                matrix: finalRREF.rref.data,
                pivotCols,
                augmentedVector: b
            };
        }
    },

    rref(matrix, augmentedVector = null) {
        let newMatrix = Matrix.clone(matrix);
        let aug = augmentedVector ? [...augmentedVector] : null;
        const pivotCols = [];
        let nextPivotRow = 0;

        for (let j = 0; j < newMatrix.cols; j++) {
            let index = null;
            let pivot = null;

            for (let i = nextPivotRow; i < newMatrix.rows; i++) {
                if (Math.abs(newMatrix.data[i][j]) > 1e-10) {
                    index = i;
                    pivot = newMatrix.data[i][j];
                    break;
                }
            }

            if (pivot) {
                pivotCols.push(j);

                if (index !== nextPivotRow) {
                    newMatrix = Matrix.switchRows(newMatrix, index, nextPivotRow);
                    if (aug) [aug[index], aug[nextPivotRow]] = [aug[nextPivotRow], aug[index]];
                }

                const scale = 1 / pivot;
                newMatrix.data[nextPivotRow] = Matrix.scalarVectorProduct(newMatrix.data[nextPivotRow], scale);
                if (aug) aug[nextPivotRow] *= scale;

                for (let i = 0; i < newMatrix.rows; i++) {
                    if (i !== nextPivotRow && Math.abs(newMatrix.data[i][j]) > 1e-10) {
                        const factor = -newMatrix.data[i][j];
                        newMatrix.data[i] = Matrix.sumRows(newMatrix, nextPivotRow, i, factor);
                        if (aug) aug[i] += factor * aug[nextPivotRow];
                    }
                }

                nextPivotRow++;
            }
        }

        return {
            pivotCols,
            augmentedVector: aug,
            rref: newMatrix
        };
    },

    augmentVector(matrix, vector) {
        if (!Array.isArray(vector)) {
            throw new Error("Vector must be an array.");
        }
        if (vector.length !== matrix.rows) {
            throw new Error("Solution vector length must equal number of rows.");
        }

        const newData = structuredClone(matrix.data);
        for (let i = 0; i < matrix.rows; i++) {
            newData[i].push(vector[i]);
        }

        return Matrix.create(newData);
    },

    *inverseSteps(matrix) {
        // Check if square
        if (matrix.rows !== matrix.cols) {
            yield {
                phase: 'inverse',
                action: 'error',
                description: `<p><strong>Matrix must be square to have an inverse.</strong></p>
                    <p>Current matrix is ${matrix.rows} × ${matrix.cols}.</p>
                    <p>Only square matrices (n × n) can have inverses.</p>`,
                matrix: structuredClone(matrix.data),
                isValid: false
            };
            return;
        }

        const n = matrix.rows;

        yield {
            phase: 'inverse',
            action: 'start',
            description: `<p><strong>Starting Matrix Inversion Process</strong></p>
                <p>Matrix to invert is ${n} x ${n}.</p>
                <p>We'll use the Gauss-Jordan elimination method:</p>
                <ol>
                    <li>Create augmented matrix [A | I] where I is the identity matrix</li>
                    <li>Perform Gauss-Jordan elimination on the augmented matrix</li>
                    <li>If we succeed, the right half becomes A<sup>-1</sup></li>
                    <li>If we fail (matrix is singular), no inverse exists</li>
                </ol>`,
            matrix: structuredClone(matrix.data),
            isValid: true
        };

        // Create augmented matrix [A | I]
        const augmentedData = structuredClone(matrix.data);
        yield {
            phase: 'inverse',
            action: 'create_augmented',
            description: `<p><strong>Creating Augmented Matrix [A | I]</strong></p>
                <p>We append an ${n} × ${n} identity matrix to the right of our original matrix.</p>
                <p>This creates a ${n} × ${2 * n} augmented matrix.</p>`,
            matrix: structuredClone(augmentedData),
            augmented: true
        };

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (j === i) {
                    augmentedData[i].push(1);
                } else {
                    augmentedData[i].push(0);
                }
            }
        }

        const augmentedMatrix = Matrix.create(augmentedData);
        yield {
            phase: 'inverse',
            action: 'augmented_created',
            description: `<p><strong>Augmented Matrix Created</strong></p>
                <p>The augmented matrix [A | I] is now ready for elimination.</p>
                <p>Left side: Original matrix A</p>
                <p>Right side: Identity matrix I</p>`,
            matrix: structuredClone(augmentedMatrix.data),
            augmented: true,
            originalMatrix: structuredClone(matrix.data)
        };

        let currentMatrix = Matrix.clone(augmentedMatrix);
        const pivotCols = [];
        let nextPivotRow = 0;
        let isSingular = false;

        yield {
            phase: 'inverse',
            action: 'elimination_start',
            description: `<p><strong>Starting Gauss-Jordan Elimination</strong></p>
                <p>We'll perform elimination on the augmented matrix to transform [A | I] into [I | A<sup>-1</sup>].</p>`,
            matrix: structuredClone(currentMatrix.data),
            pivotCols: [],
            augmented: true
        };

        // Process each column
        for (let j = 0; j < n; j++) {
            if (nextPivotRow >= n) break;

            yield {
                phase: 'inverse',
                action: 'search_pivot',
                description: `<p><strong>Searching for pivot in column ${j + 1}</strong></p>
                    <p>Looking for first non-zero entry from row ${nextPivotRow + 1} downward.</p>`,
                matrix: structuredClone(currentMatrix.data),
                pivotCols: [...pivotCols],
                currentColumn: j,
                searchStart: nextPivotRow,
                augmented: true
            };

            // Find pivot
            let pivotRow = null;
            let pivotValue = null;

            for (let i = nextPivotRow; i < n; i++) {
                if (Math.abs(currentMatrix.data[i][j]) > 1e-10) {
                    pivotRow = i;
                    pivotValue = currentMatrix.data[i][j];
                    break;
                }
            }

            // No pivot in this row. Then the matrix is singular and has no inverse.
            if (pivotRow === null) {
                yield {
                    phase: 'inverse',
                    action: 'singular_detected',
                    description: `<p><strong>Matrix is singular!</strong></p>
                        <p>No non-zero pivot found in column ${j + 1}.</p>
                        <p>This means the matrix is not invertible (determinant is zero).</p>`,
                    matrix: structuredClone(currentMatrix.data),
                    pivotCols: [...pivotCols],
                    currentColumn: j,
                    augmented: true
                };
                isSingular = true;
                break;
            }

            pivotCols.push(j);

            yield {
                phase: 'inverse',
                action: 'pivot_found',
                description: `<p><strong>Pivot found at (${pivotRow + 1}, ${j + 1})</strong></p>
                    <p>Value: ${formatNumber(pivotValue)}</p>`,
                matrix: structuredClone(currentMatrix.data),
                pivotCols: [...pivotCols],
                pivotPosition: { row: pivotRow, col: j },
                augmented: true
            };

            // Swap if needed
            if (pivotRow !== nextPivotRow) {
                yield {
                    phase: 'inverse',
                    action: 'swap_explanation',
                    description: `<p><strong>Swapping rows ${pivotRow + 1} and ${nextPivotRow + 1}</strong></p>
                        <p>To bring pivot to diagonal position for proper elimination.</p>`,
                    matrix: structuredClone(currentMatrix.data),
                    pivotCols: [...pivotCols],
                    augmented: true
                };

                currentMatrix = Matrix.switchRows(currentMatrix, pivotRow, nextPivotRow);

                yield {
                    phase: 'inverse',
                    action: 'swapped',
                    description: `<p><strong>Rows swapped successfully</strong></p>
                        <p>Pivot now at position (${nextPivotRow + 1}, ${j + 1}).</p>`,
                    matrix: structuredClone(currentMatrix.data),
                    pivotCols: [...pivotCols],
                    augmented: true
                };
            }

            // Scale pivot row to 1
            const scale = 1 / currentMatrix.data[nextPivotRow][j];

            yield {
                phase: 'inverse',
                action: 'scale_explanation',
                description: `<p><strong>Scaling pivot row ${nextPivotRow + 1}</strong></p>
                    <p>Scale factor: 1 / ${formatNumber(currentMatrix.data[nextPivotRow][j])} = ${formatNumber(scale)}</p>
                    <p>To make the pivot equal to 1.</p>`,
                matrix: structuredClone(currentMatrix.data),
                pivotCols: [...pivotCols],
                augmented: true
            };

            currentMatrix.data[nextPivotRow] = Matrix.scalarVectorProduct(
                currentMatrix.data[nextPivotRow],
                scale
            );

            yield {
                phase: 'inverse',
                action: 'scaled',
                description: `<p><strong>Row scaled successfully</strong></p>
                    <p>Pivot at (${nextPivotRow + 1}, ${j + 1}) is now 1.</p>`,
                matrix: structuredClone(currentMatrix.data),
                pivotCols: [...pivotCols],
                augmented: true
            };

            // Eliminate all other rows
            yield {
                phase: 'inverse',
                action: 'eliminate_explanation',
                description: `<p><strong>Eliminating column ${j + 1}</strong></p>
                    <p>Making all other entries in column ${j + 1} equal to zero.</p>
                    <p>We'll eliminate both above and below the pivot since this is Gauss-Jordan.</p>`,
                matrix: structuredClone(currentMatrix.data),
                pivotCols: [...pivotCols],
                augmented: true
            };

            for (let i = 0; i < n; i++) {
                if (i !== nextPivotRow && Math.abs(currentMatrix.data[i][j]) > 1e-10) {
                    const factor = -currentMatrix.data[i][j];

                    yield {
                        phase: 'inverse',
                        action: 'eliminate_row',
                        description: `<p><strong>Eliminating row ${i + 1}</strong></p>
                            <p>Row ${i + 1} → Row ${i + 1} + (${formatNumber(factor)}) x Row ${nextPivotRow + 1}</p>`,
                        matrix: structuredClone(currentMatrix.data),
                        pivotCols: [...pivotCols],
                        targetRow: i,
                        augmented: true
                    };

                    currentMatrix.data[i] = Matrix.sumRows(
                        currentMatrix,
                        nextPivotRow,
                        i,
                        factor
                    );

                    yield {
                        phase: 'inverse',
                        action: 'row_eliminated',
                        description: `<p><strong>Row ${i + 1} eliminated successfully</strong></p>
                            <p>Entry at (${i + 1}, ${j + 1}) is now zero.</p>`,
                        matrix: structuredClone(currentMatrix.data),
                        pivotCols: [...pivotCols],
                        augmented: true
                    };
                }
            }

            yield {
                phase: 'inverse',
                action: 'column_complete',
                description: `<p><strong>Column ${j + 1} complete</strong></p>
                    <p>Column ${j + 1} now has 1 at (${nextPivotRow + 1}, ${j + 1}) and 0 everywhere else.</p>`,
                matrix: structuredClone(currentMatrix.data),
                pivotCols: [...pivotCols],
                augmented: true
            };

            nextPivotRow++;
        }

        // No inverse
        if (isSingular || pivotCols.length < n) {
            yield {
                phase: 'inverse',
                action: 'no_inverse',
                description: `<p><strong>Matrix is singular - no inverse exists!</strong></p>
                    <p>Found only ${pivotCols.length} pivots out of ${n}.</p>
                    <p>The matrix has determinant 0 and is not invertible.</p>
                    <p><strong>Possible reasons:</strong></p>
                    <ul>
                        <li>Rows are linearly dependent</li>
                        <li>Columns are linearly dependent</li>
                        <li>Matrix has rank less than ${n}</li>
                    </ul>`,
                matrix: structuredClone(matrix.data),
                pivotCols: [...pivotCols],
                rank: pivotCols.length,
                hasInverse: false
            };
            return;
        }

        // Extract inverse from the right side of the matrix
        const inverseData = [];
        for (let i = 0; i < n; i++) {
            inverseData.push(currentMatrix.data[i].slice(n));
        }

        const inverseMatrix = Matrix.create(inverseData);

        yield {
            phase: 'inverse',
            action: 'extract_inverse',
            description: `<p><strong>Extracting Inverse Matrix</strong></p>
                <p>The right half of the augmented matrix is now the inverse A<sup>-1</sup>.</p>
                <p>We extract columns ${n + 1} through ${2 * n} as our inverse matrix.</p>`,
            matrix: structuredClone(currentMatrix.data),
            inverseMatrix: structuredClone(inverseData),
            augmented: true
        };

        yield {
            phase: 'inverse',
            action: 'complete',
            description: `<p><strong>Inverse Matrix Found!</strong></p>
                <p>Successfully computed the inverse of the ${n} x ${n} matrix.</p>
                <p><strong>Summary:</strong></p>
                <ul>
                    <li>Matrix rank: ${n} (full rank)</li>
                    <li>Pivot columns: ${pivotCols.map(col => col + 1).join(', ')}</li>
                    <li>Matrix is non-singular (determinant != 0)</li>
                </ul>`,
            originalMatrix: structuredClone(matrix.data),
            inverseMatrix: structuredClone(inverseData),
            hasInverse: true,
            rank: n
        };

        return inverseMatrix;
    },
};

export const createMatrix = (data) => Matrix.create(data);