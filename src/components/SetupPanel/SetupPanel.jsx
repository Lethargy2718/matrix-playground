import { useState, useEffect, Fragment, useRef } from 'react';
import { getRandomInt } from '../../utils/helpers';
import './SetupPanel.css';
import { SOLVE_TYPES } from '../../utils/actions';
import AIPanel from '../AIPanel/AIPanel';  // <-- add this import

const SetupPanel = ({ onSolve }) => {
    const [equations, setEquations] = useState(3);
    const [variables, setVariables] = useState(3);
    const [solveType, setSolveType] = useState(SOLVE_TYPES.REF);
    const [matrixData, setMatrixData] = useState([]);
    const runButtonRef = useRef(null);

    useEffect(() => {
        if (runButtonRef.current) runButtonRef.current.focus();
    }, []);

    useEffect(() => {
        generateMatrix();
    }, [equations, variables]);

    const generateMatrix = () => {
        const newMatrix = [];
        for (let i = 0; i < equations; i++) {
            const row = [];
            for (let j = 0; j < variables; j++) {
                row.push(String(getRandomInt(-5, 5)));
            }
            newMatrix.push({ coefficients: row, constant: String(getRandomInt(-10, 10)) });
        }
        setMatrixData(newMatrix);
    };

    const handleCoefficientChange = (rowIndex, colIndex, value) => {
        const newMatrix = [...matrixData];
        newMatrix[rowIndex].coefficients[colIndex] = value;
        setMatrixData(newMatrix);
    };

    const handleConstantChange = (rowIndex, value) => {
        const newMatrix = [...matrixData];
        newMatrix[rowIndex].constant = value;
        setMatrixData(newMatrix);
    };

    // Called by AIPanel when the AI has parsed a valid system
    const handleMatrixReady = ({ equations: eq, variables: vars, matrixData: md, solveType: st }) => {
        setEquations(eq);
        setVariables(vars);
        setMatrixData(md);
        if (st && SOLVE_TYPES[st]) setSolveType(SOLVE_TYPES[st]);
    };

    const handleSolve = () => {
        const A = matrixData.map(row => row.coefficients.map(v => parseFloat(v) || 0));
        const b = matrixData.map(row => parseFloat(row.constant) || 0);
        onSolve({ A, b, equations, variables, solveType });
    };

    return (
        <div className="setup-panel">
            <div className="panel-header">
                <h2>System Setup</h2>
            </div>

            {/* ── AI panel sits above the manual controls ── */}
            <AIPanel onMatrixReady={handleMatrixReady} />

            <div className="input-controls shadow">
                <div className="control-group">
                    <label htmlFor="equations">Number of Equations:</label>
                    <input
                        type="number"
                        id="equations"
                        min="1"
                        max="20"
                        value={equations}
                        onChange={(e) => setEquations(parseInt(e.target.value))}
                    />
                </div>
                <div className="control-group">
                    <label htmlFor="variables">Number of Variables:</label>
                    <input
                        type="number"
                        id="variables"
                        min="1"
                        max="20"
                        value={variables}
                        onChange={(e) => setVariables(parseInt(e.target.value))}
                    />
                </div>
                <button className="btn-primary" onClick={generateMatrix}>
                    Generate Matrix
                </button>
            </div>

            <div className="matrix-input-container shadow">
                <div className="matrix-header">
                    <h3>Enter Coefficients & Solutions</h3>
                </div>
                <div className="matrix-input shadow">
                    <div className="matrix-input-rows">
                        {matrixData.map((row, i) => (
                            <div key={i} className="matrix-row">
                                <span className="equation-line">
                                    L<sub>{i + 1}</sub> :
                                </span>
                                {row.coefficients.map((coeff, j) => (
                                    <Fragment key={j}>
                                        <span className="equation-term">
                                            <input
                                                type="number"
                                                className="coeff-input"
                                                placeholder="0"
                                                value={coeff}
                                                onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                                                onBlur={(e) => { if (e.target.value === '') handleCoefficientChange(i, j, '0'); }}
                                                onChange={(e) => handleCoefficientChange(i, j, e.target.value)}
                                            />
                                            <span className="variable">x<sub>{j + 1}</sub></span>
                                        </span>
                                        {j < variables - 1 && <span className="operator">+</span>}
                                    </Fragment>
                                ))}
                                <span className="equals">=</span>
                                <input
                                    type="number"
                                    className="result-input"
                                    placeholder="0"
                                    value={row.constant}
                                    onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                                    onBlur={(e) => { if (e.target.value === '') handleConstantChange(i, '0'); }}
                                    onChange={(e) => handleConstantChange(i, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="solve-options">
                    {[
                        [SOLVE_TYPES.REF, 'Row Echelon Form'],
                        [SOLVE_TYPES.RREF, 'Reduced Row Echelon Form'],
                        [SOLVE_TYPES.FULL, 'Solve System of Equations'],
                        [SOLVE_TYPES.INVERSE, 'Inverse'],
                    ].map(([val, label]) => (
                        <label key={val} className="option-label">
                            <input
                                type="radio"
                                name="solve-type"
                                value={val}
                                checked={solveType === val}
                                onChange={(e) => setSolveType(e.target.value)}
                            />
                            <span className="radio-custom" />
                            {label}
                        </label>
                    ))}
                </div>

                <button className="btn-primary solve-btn" onClick={handleSolve} ref={runButtonRef}>
                    Run
                </button>
            </div>
        </div>
    );
};

export default SetupPanel;