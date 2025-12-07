import { formatNumber } from '../../utils/helpers';
import './MatrixDisplay.css';

const MatrixDisplay = ({
    matrix,
    augmentedVector = null,
    changedRows = [],
    pivots = [],
    columnWidth,
}) => {
    if (!matrix) {
        return <div className="no-matrix">No matrix data</div>;
    }

    const numCols = matrix[0].length + (augmentedVector ? 1 : 0);
    return (
        <div className="matrix-display shadow">
            <div className="matrix-display-inner">
                <div
                    className="matrix-grid"
                    style={{
                        gridTemplateColumns: `repeat(${numCols}, max(${columnWidth}, 50px))`
                    }}
                >

                    {matrix.map((row, i) => (
                        <div key={i} className="matrix-row-container">
                            {row.map((value, j) => {
                                const isPivot = pivots.some(pivot => pivot.row === i && pivot.col === j);
                                const isChanged = changedRows.includes(i);

                                return (
                                    <div
                                        key={j}
                                        className={`matrix-cell ${isPivot ? 'pivot-element' : ''} ${isChanged ? 'changed-row' : ''}`}
                                    >
                                        <div className="matrix-cell-inner">
                                            {formatNumber(value)}
                                        </div>
                                    </div>
                                );
                            })}

                            {augmentedVector && (
                                <div
                                    className={`matrix-cell augmented ${changedRows.includes(i) ? 'changed-row' : ''}`}
                                >
                                    <div className="matrix-cell-inner">
                                        {formatNumber(augmentedVector[i])}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MatrixDisplay;