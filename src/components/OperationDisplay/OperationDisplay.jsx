import { formatNumber } from '../../utils/helpers';
import './OperationDisplay.css';

const OperationDisplay = ({ step }) => {
    if (!step) {
        return (
            <div className="operation-display shadow">
                <div className="operation-output">
                    <div className="operation-placeholder">No operation in progress</div>
                </div>
            </div>
        );
    }

    // Handle solution and analysis phases
    if (step.phase === 'solution' || step.phase === 'analysis') {
        return (
            <div className="operation-display shadow">
                <div className="operation-output">
                    <div className="operation-placeholder">Solution Analysis</div>
                </div>
            </div>
        );
    }

    let operationType = '';
    let operationDetail = step.description || '';

    // Handle inverse phase
    if (step.phase === 'inverse') {
        const inverseOperationTypes = {
            'start': 'Starting Matrix Inversion',
            'create_augmented': 'Creating Augmented Matrix',
            'augmented_created': 'Augmented Matrix Ready',
            'elimination_start': 'Starting Gauss-Jordan Elimination',
            'search_pivot': 'Searching for Pivot',
            'pivot_found': 'Pivot Found',
            'swap_explanation': 'Row Swap Explanation',
            'swap': 'Row Swap',
            'swapped': 'Rows Swapped',
            'scale_explanation': 'Scaling Explanation',
            'scale': 'Row Scaling',
            'scaled': 'Row Scaled',
            'eliminate_explanation': 'Elimination Strategy',
            'eliminate_row': 'Eliminating Row',
            'row_eliminated': 'Row Eliminated',
            'column_complete': 'Column Complete',
            'singular_detected': 'Singular Matrix Detected',
            'no_inverse': 'No Inverse Exists',
            'extract_inverse': 'Extracting Inverse Matrix',
            'verification_explanation': 'Verifying the Inverse',
            'complete': 'Inverse Calculation Complete',
            'error': 'Error'
        };

        operationType = inverseOperationTypes[step.action] ||
            step.action?.replace(/_/g, ' ') ||
            'Matrix Inversion';

        // Format numbers in the description
        operationDetail = operationDetail.replace(/([+-]?\d*\.?\d+(?:e[+-]?\d+)?)/gi, (match) => {
            const num = parseFloat(match);
            if (!isNaN(num)) {
                return formatNumber(num);
            }
            return match;
        });
    }
    else if (step.phase === 'rref') {
        const rrefOperationTypes = {
            'start': 'Starting RREF',
            'search_pivot': 'Searching for Pivot',
            'pivot_found': 'Pivot Found',
            'swap_needed': 'Row Swap Needed',
            'swap': 'Row Swap',
            'pivot_correct_position': 'Pivot in Position',
            'scale_explanation': 'Scaling Explanation',
            'scale': 'Row Scaling',
            'pivot_already_one': 'Pivot Already 1',
            'eliminate_explanation': 'Elimination Strategy',
            'eliminate': 'Row Elimination',
            'no_elimination_needed': 'No Elimination Needed',
            'pivot_complete': 'Pivot Complete',
            'no_pivot_detailed': 'No Pivot Found',
            'final': 'Final Result',
            'pivot_forward_complete': "Pivot's Forward Elimination Complete",
            'gauss_start': "Gauss Start",
            'gauss_jordan_start': "Gauss-Jordan Start",
            "back_substitute_start": "Back Substitution Start",
            'eliminate_above_explanation': "Eliminate Above Explanation",
            "eliminate_above": "Eliminating Above",
            'pivot_phase2_complete': "Pivot's Phase 2 Complete",
            'no_elimination_above_needed': "No Elimination Needed",
            "perfect_pivot_found": "Perfect Pivot Found",
        };

        operationType = rrefOperationTypes[step.action] || step.action;

        operationDetail = operationDetail.replace(/([+-]?\d*\.?\d+(?:e[+-]?\d+)?)/gi, (match) => {
            const num = parseFloat(match);
            if (!isNaN(num)) {
                return formatNumber(num);
            }
            return match;
        });
    }
    else {
        operationType = step.phase;
        operationDetail = step.description || '';
    }

    const getOperationClass = () => {
        const baseClass = `solution-details operation-${step.phase}`;
        const actionClass = step.action ? `operation-${step.action}` : '';

        if (step.phase === 'inverse') {
            if (step.action === 'complete' || step.action === 'extract_inverse') {
                return `${baseClass} ${actionClass} success-operation`;
            }
            if (step.action === 'error' || step.action === 'no_inverse' || step.action === 'singular_detected') {
                return `${baseClass} ${actionClass} error-operation`;
            }
            if (step.action === 'swap' || step.action === 'scale' || step.action === 'eliminate_row') {
                return `${baseClass} ${actionClass} action-operation`;
            }
        }

        return `${baseClass} ${actionClass} fade-in`;
    };

    return (
        <div className="operation-display shadow">
            <div className="operation-output">
                <div
                    key={step.action + step.phase + step.description}
                    className={getOperationClass()}
                >
                    <div className="operation-type">{operationType}</div>
                    <div
                        className="operation-detail"
                        dangerouslySetInnerHTML={{ __html: operationDetail }}
                    />

                    {step.phase === 'inverse' && step.action === 'complete' && step.hasInverse && (
                        <div className="inverse-success">
                            <div className="success-message">
                                Matrix inversion successful! The inverse exists and has been calculated.
                            </div>
                        </div>
                    )}

                    {step.phase === 'inverse' && step.action === 'no_inverse' && (
                        <div className="inverse-error">
                            <div className="error-message">
                                Matrix is singular and cannot be inverted. Determinant is zero.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OperationDisplay;