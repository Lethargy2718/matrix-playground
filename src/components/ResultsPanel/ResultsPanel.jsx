import { useState, useEffect, useMemo } from 'react';
import { createMatrix, Matrix } from '../../utils/matrix';
import StepNavigation from '../StepNavigation/StepNavigation';
import OperationDisplay from '../OperationDisplay/OperationDisplay';
import MatrixDisplay from '../MatrixDisplay/MatrixDisplay';
import SolutionOutput from '../SolutionOutput/SolutionOutput';
import { formatNumber } from '../../utils/helpers';
import './ResultsPanel.css';
import { SOLVE_TYPES } from '../../utils/actions';

const ResultsPanel = ({ solverData, onBack }) => {
    const [currentSteps, setCurrentSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [previousStepData, setPreviousStepData] = useState(null);
    const [initialMatrix, setInitialMatrix] = useState(null);
    const [inverseResult, setInverseResult] = useState(null);

    const firstSolutionStepIndex = useMemo(() => {
        return currentSteps.findIndex(s => s.type === "ready_to_solve");
    }, [currentSteps, solverData]);

    const columnWidth = useMemo(() => {
        let maxLength = 3;

        if (currentSteps.length > 0) {
            // Get all matrix values from steps
            const allValues = currentSteps.flatMap(step => {
                if (step.matrix) {
                    return step.matrix.flat();
                }
                if (step.inverseMatrix) {
                    return step.inverseMatrix.flat();
                }
                if (step.originalMatrix) {
                    return step.originalMatrix.flat();
                }
                return [];
            });

            if (currentSteps[0]?.augmentedVector) {
                allValues.push(...currentSteps[0].augmentedVector);
            }

            if (allValues.length > 0) {
                maxLength = Math.max(...allValues.map(val => {
                    const formatted = formatNumber(val);
                    return formatted.length;
                }));
            }
        }

        return `min(${maxLength}ch, 6ch)`;
    }, [currentSteps]);

    // Initialize steps with solver data
    useEffect(() => {
        if (solverData) {
            const { A, b, solveType } = solverData;
            const matrix = createMatrix(A);

            setInitialMatrix({ A, b });
            setInverseResult(null);

            let steps;
            switch (solveType) {
                case SOLVE_TYPES.RREF:
                    steps = Array.from(Matrix.elimination(matrix, b, true));
                    break;
                case SOLVE_TYPES.REF:
                    steps = Array.from(Matrix.elimination(matrix, b, false));
                    break;
                case SOLVE_TYPES.INVERSE:
                    steps = Array.from(Matrix.inverseSteps(matrix));

                    // Extract the final inverse matrix from the last step
                    const lastStep = steps[steps.length - 1];
                    if (lastStep?.inverseMatrix && lastStep?.hasInverse) {
                        setInverseResult(createMatrix(lastStep.inverseMatrix));
                    }
                    break;
                case SOLVE_TYPES.FULL:
                default:
                    steps = Array.from(Matrix.solveSystemSteps(matrix, b));
                    break;
            }
            setCurrentSteps(steps);
            setPreviousStepData(null);
            setCurrentStepIndex(0);
        }
    }, [solverData]);

    const navigateStep = (dir) => {
        const newIndex = currentStepIndex + dir;
        if (newIndex < 0 || newIndex >= currentSteps.length) return;

        if (currentStepIndex >= 0) {
            setPreviousStepData(currentSteps[currentStepIndex]);
        }
        setCurrentStepIndex(newIndex);
    };

    const onInput = (e) => {
        const val = Number(e.target.value);
        if (!Number.isFinite(val)) return;
        navigateTo(val);
    }

    const navigateTo = (targetIdx) => {
        const clamped = Math.max(1, Math.min(targetIdx, currentSteps.length));
        const stepsToTake = clamped - (currentStepIndex + 1);
        if (stepsToTake !== 0) navigateStep(stepsToTake);
    }

    const currentStep = currentSteps[currentStepIndex];

    const isInversePhase = currentStep?.phase === "inverse";
    const isRrefPhase = currentStep?.phase === "rref";
    const isAnalysisPhase = currentStep?.phase === "analysis";
    const isSolutionPhase = currentStep?.phase === "solution";

    // Get appropriate matrix for display based on phase
    const getDisplayMatrix = (step) => {
        if (!step) return null;

        if (step.inverseMatrix && step.phase === 'inverse') {
            return step.inverseMatrix;
        }
        if (step.matrix) {
            return step.matrix;
        }
        if (step.originalMatrix && step.phase === 'inverse') {
            return step.originalMatrix;
        }
        return null;
    };

    const getPreviousMatrix = () => {
        if (previousStepData) {
            return getDisplayMatrix(previousStepData);
        }
        return initialMatrix?.A;
    };

    const getCurrentMatrix = () => {
        if (currentStep) {
            return getDisplayMatrix(currentStep);
        }
        return initialMatrix?.A;
    };

    return (
        <div className="results-panel shadow">
            <div className="panel-header">
                <h2>
                    {solverData?.solveType === SOLVE_TYPES.INVERSE
                        ? "Matrix Inversion"
                        : "Step-by-Step Solution"}
                </h2>

                <div className="panel-header-control">
                    {firstSolutionStepIndex !== -1 && currentSteps.length > 0 &&
                        <button
                            id="sol-btn"
                            className='btn-secondary'
                            onClick={() => navigateTo(firstSolutionStepIndex + 1)}
                        >
                            <span className="desktop-jump">Jump to Solution Steps</span>
                        </button>
                    }

                    <button id="back-btn" className="btn-secondary btn-quit" onClick={onBack}>
                        X
                    </button>
                </div>
            </div>

            <StepNavigation
                currentStepIndex={currentStepIndex}
                totalSteps={currentSteps.length}
                onPrevious={() => navigateStep(-1)}
                onNext={() => navigateStep(1)}
                onInput={(e) => onInput(e)}
                onStart={() => navigateTo(1)}
                onEnd={() => navigateTo(currentSteps.length)}
            />

            {isRrefPhase && (
                <>
                    <div className="matrix-comparison-container">
                        <OperationDisplay step={currentStep} />

                        <div className="matrix-comparison">
                            <div className="matrix-panel shadow">
                                <h4>Previous</h4>
                                <MatrixDisplay
                                    matrix={getPreviousMatrix()}
                                    augmentedVector={previousStepData?.augmentedVector || initialMatrix?.b}
                                    pivots={previousStepData?.pivots}
                                    columnWidth={columnWidth}
                                    isAugmented={previousStepData?.augmented || false}
                                    showInversePart={currentStep?.augmented}
                                />
                            </div>
                            <div className="matrix-panel shadow">
                                <h4>Current</h4>
                                <MatrixDisplay
                                    matrix={getCurrentMatrix()}
                                    augmentedVector={currentStep.augmentedVector}
                                    pivots={currentStep.pivots}
                                    changedRows={getChangedRows(currentStep)}
                                    columnWidth={columnWidth}
                                    isAugmented={currentStep?.augmented || false}
                                    showInversePart={currentStep?.augmented}
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {isInversePhase && (
                <div className="inverse-phase-container">
                    <OperationDisplay step={currentStep} />

                    <div className="matrix-comparison">
                        {currentStepIndex === 0 ? (
                            // Initial matrix display
                            <div className="matrix-panel shadow full-width">
                                <h4>Original Matrix</h4>
                                <MatrixDisplay
                                    matrix={currentStep.matrix || currentStep.originalMatrix}
                                    columnWidth={columnWidth}
                                />
                            </div>
                        ) : (currentStepIndex != currentSteps.length - 1 &&
                            // Augmented matrix display
                            <>
                                <div className="matrix-panel shadow">
                                    <h4>Previous</h4>
                                    <MatrixDisplay
                                        matrix={getPreviousMatrix()}
                                        pivots={previousStepData?.pivots}
                                        columnWidth={columnWidth}
                                        isAugmented={true}
                                        showInversePart={true}
                                        changedRows={previousStepData ? getChangedRows(previousStepData) : []}
                                    />
                                </div>
                                <div className="matrix-panel shadow">
                                    <h4>Current</h4>
                                    <MatrixDisplay
                                        matrix={getCurrentMatrix()}
                                        pivots={currentStep.pivots}
                                        changedRows={getChangedRows(currentStep)}
                                        columnWidth={columnWidth}
                                        isAugmented={true}
                                        showInversePart={true}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {
                (isAnalysisPhase || isSolutionPhase) && (
                    <>
                        <SolutionOutput step={currentStep} />

                        {/* Show final RREF matrix */}
                        {currentStep.matrix && (
                            <div className="final-matrix-section shadow">
                                <div className="final-matrix-header">
                                    <h3>Final Reduced Matrix</h3>
                                </div>
                                <MatrixDisplay
                                    matrix={currentStep.matrix}
                                    augmentedVector={currentStep.augmentedVector}
                                    changedRows={getChangedRows(currentStep)}
                                    columnWidth={columnWidth}
                                    pivots={currentStep.pivots}
                                />
                            </div>
                        )}
                    </>
                )
            }

            {/* Show inverse result alone if calculated */}
            {
                inverseResult && currentStepIndex === currentSteps.length - 1 && (
                    <div className="matrix-comparison">

                        <div className="matrix-panel shadow">
                            <h4>Original Matrix</h4>
                            <MatrixDisplay
                                matrix={currentStep.matrix || currentStep.originalMatrix}
                                columnWidth={columnWidth}
                            />
                        </div>
                        <div className="matrix-panel shadow">
                            <h4>Inverse</h4>
                            <MatrixDisplay
                                matrix={inverseResult.data}
                                columnWidth={columnWidth}
                            />
                        </div>
                    </div>
                )
            }

        </div >
    );
};

function getChangedRows(step) {
    if (!step) return [];

    const changedRows = new Set();

    // Handle all possible action types
    if (step.action === 'swap' || step.action === 'swapped' || step.action === 'swap_explanation') {
        const swapMatch = step.description?.match(/Row (\d+) and Row (\d+)/);
        if (swapMatch) {
            changedRows.add(parseInt(swapMatch[1]) - 1);
            changedRows.add(parseInt(swapMatch[2]) - 1);
        }

        // Alternative pattern
        if (step.description?.includes('rows swapped')) {
            const rowsMatch = step.description?.match(/rows? (\d+) and (\d+)/i);
            if (rowsMatch) {
                changedRows.add(parseInt(rowsMatch[1]) - 1);
                changedRows.add(parseInt(rowsMatch[2]) - 1);
            }
        }
    }

    else if (step.action === 'scale' || step.action === 'scaled' ||
        step.action === 'scale_explanation' || step.action === 'scaling') {
        const scaleMatch = step.description?.match(/row (\d+)/i);
        if (scaleMatch) {
            changedRows.add(parseInt(scaleMatch[1]) - 1);
        }

        // Also check for pivot row if available
        if (step.pivotPosition) {
            changedRows.add(step.pivotPosition.row);
        }
    }

    else if (step.action === 'eliminate' || step.action === 'eliminate_above' ||
        step.action === 'eliminate_explanation' || step.action === 'eliminate_above_explanation' ||
        step.action === 'row_eliminated' || step.action === 'eliminate_row') {

        // Check description for row numbers
        const elimMatch = step.description?.match(/Row (\d+) →/);
        if (elimMatch) {
            changedRows.add(parseInt(elimMatch[1]) - 1);
        }

        // Also check for target row in step data
        if (step.targetRow !== undefined) {
            changedRows.add(step.targetRow);
        }

        if (step.targetPosition) {
            changedRows.add(step.targetPosition.row);
        }
    }

    else if (step.action === 'pivot_phase1_complete' || step.action === 'pivot_phase2_complete' ||
        step.action === 'column_complete' || step.action === 'pivot_found') {
        if (step.pivotPosition) {
            changedRows.add(step.pivotPosition.row);
        }
        else if (step.pivots && step.pivots.length > 0) {
            const lastPivot = step.pivots[step.pivots.length - 1];
            if (lastPivot) {
                changedRows.add(lastPivot.row);
            }
        }
    }

    // inverse specific actions
    else if (step.action === 'augmented_created' || step.action === 'create_augmented') {
        // All rows might be changed when creating augmented matrix
        if (step.matrix) {
            for (let i = 0; i < step.matrix.length; i++) {
                changedRows.add(i);
            }
        }
    }

    return Array.from(changedRows);
}

export default ResultsPanel;