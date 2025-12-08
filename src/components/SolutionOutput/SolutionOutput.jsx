import React from 'react';
import { formatNumber } from '../../utils/helpers';
import './SolutionOutput.css';

import { useRef, useEffect } from "react";

const SolutionOutput = ({ step }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        // Scroll to top whenever step changes
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
    }, [step]);

    if (!step) {
        return (
            <div className="solution-output">
                <div className="no-solution">No solution data available</div>
            </div>
        );
    }

    // Skip RREF steps in solution output
    if (step.phase === "rref") return <></>;

    return (
        //  NOTE: used to be "solution-output"
        <div className="operation-display solution-display shadow" ref={containerRef}>
            {/* NOTE: used to have the class "solution-block" instead of "operation-output" */}
            <div className={`operation-output ${step.type}`}>
                <div key={step.type + step.description} className="solution-details fade-in">
                    {renderSolutionContent(step)}
                </div>
            </div>
        </div>
    );
};

// Standardized content structure
const renderSolutionContent = (step) => {
    return (
        <>
            {step.description && (
                <div className="operation-type" dangerouslySetInnerHTML={{ __html: step.description }} />
            )}


            {/* 
                block: {
                    title: string
                    data: html
                }
            */}

            {step.blocks?.length > 0 &&
                step.blocks.map((block, i) => (
                    <SolutionSection title={block.title} key={i}>
                        <div dangerouslySetInnerHTML={{ __html: block.data }} />
                    </SolutionSection>
                ))
            }

            {step.solution && (
                <SolutionSection type="result" title="Unique Solution">
                    <div className="vector-display">
                        x = [{step.solution.map(v => formatNumber(v)).join(', ')}]
                    </div>
                </SolutionSection>
            )}

            {step.type === 'infinite_solutions_general' && (
                <InfiniteSolutionContent step={step} />
            )}
        </>
    );
};

const SolutionSection = ({ title, children, content }) => {
    return (
        <div className={`solution-section shadow`}>
            {title && <div className="section-title">{title}</div>}
            {content && (
                <div className="section-content" dangerouslySetInnerHTML={{ __html: content }} />
            )}
            {children && <div className="section-content">{children}</div>}
        </div>
    );
};

const InfiniteSolutionContent = ({ step }) => {
    const { freeVars } = step;

    return (
        <div className="infinite-solution-content">
            <ParametricSolution step={step} />

            {freeVars.length > 0 && (
                <SolutionSection type="free-vars" title="Free Variables">
                    <div className="info-box">
                        {freeVars.map((v, i) => (
                            <React.Fragment key={v}>
                                x<sub>{v + 1}</sub>
                                {i < freeVars.length - 1 ? ', ' : ''}
                            </React.Fragment>
                        ))}
                    </div>
                </SolutionSection>
            )}
        </div>
    );
};

const ParametricSolution = ({ step }) => {
    const { particularSolution: xp, basisVectors, variables: n } = step;

    return (
        <SolutionSection type="parametric" title="General Solution (Parametric Form)">
            <div className="variable-solutions">
                {Array.from({ length: n }).map((_, i) => {
                    let expression = '';

                    // Start with particular solution
                    if (xp[i] !== 0) {
                        expression += formatNumber(xp[i]);
                    }

                    // Add free variable terms
                    for (let j = 0; j < basisVectors.length; j++) {
                        const coeff = basisVectors[j][i];
                        if (coeff !== 0) {
                            const param = String.fromCharCode(97 + j);
                            if (expression.length > 0 && coeff > 0) {
                                expression += ' + ';
                            } else if (coeff < 0 && expression.length > 0) {
                                expression += ' - ';
                            } else if (coeff < 0) {
                                expression += '-';
                            }

                            const absCoeff = Math.abs(coeff);
                            if (absCoeff === 1) {
                                expression += param;
                            } else {
                                expression += `${formatNumber(absCoeff)}${param}`;
                            }
                        }
                    }

                    if (expression === '') expression = '0';
                    if (expression.startsWith('+ ')) expression = expression.substring(2);

                    return (
                        <div key={i} className="info-box">
                            x<sub>{i + 1}</sub> = {expression}
                        </div>
                    );
                })}
            </div>
        </SolutionSection>
    );
};

export default SolutionOutput;