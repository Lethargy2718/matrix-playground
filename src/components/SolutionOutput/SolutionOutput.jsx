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
            {/* HEADER - Main description */}
            {step.description && (
                <div className="operation-type" dangerouslySetInnerHTML={{ __html: step.description }} />
            )}

            {/* DETAILS - Explanatory list or notes */}
            {step.details && step.details.length > 0 && (
                <SolutionSection type="details" title="Details">
                    {Array.isArray(step.details)
                        ? step.details.map((d, i) => (
                            <div key={i} dangerouslySetInnerHTML={{ __html: d }} />
                        ))
                        : <div dangerouslySetInnerHTML={{ __html: step.details }} />}
                </SolutionSection>
            )}

            {step.theorem && (
                <SolutionSection type="theorem" content={step.theorem} />
            )}

            {step.reasoning && (
                <SolutionSection type="reasoning" title="Reasoning">
                    {step.reasoning.map((reason, index) => (
                        <div key={index} dangerouslySetInnerHTML={{ __html: reason }} />
                    ))}
                </SolutionSection>
            )}

            {step.cases && (
                <SolutionSection type="cases" title="Possible Cases">
                    {step.cases.map((caseText, index) => (
                        <div key={index} dangerouslySetInnerHTML={{ __html: caseText }} />
                    ))}
                </SolutionSection>
            )}

            {step.ourCase && (
                <SolutionSection type="our-case" title="Our Situation">
                    <div dangerouslySetInnerHTML={{ __html: step.ourCase }} />
                </SolutionSection>
            )}

            {step.steps && (
                <SolutionSection type="steps" title="Calculation Steps">
                    {step.steps.map((stepText, index) => (
                        <div key={index} dangerouslySetInnerHTML={{ __html: stepText }} />
                    ))}
                </SolutionSection>
            )}

            {/* {step.basisVector && (
                <SolutionSection type="result" title="Basis Vector">
                    <div className="vector-display">
                        v<sub>{step.index + 1}</sub> = [{step.basisVector.map(v => formatNumber(v)).join(', ')}]
                    </div>
                </SolutionSection>
            )} */}

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

            {step.finalExplanation && (
                <SolutionSection type="final" title="Conclusion">
                    <div dangerouslySetInnerHTML={{ __html: step.finalExplanation }} />
                </SolutionSection>
            )}
        </>
    );
};

const SolutionSection = ({ type, title, children, content }) => {
    return (
        <div className={`solution-section shadow ${type}`}>
            {title && <div className="section-title">{title}</div>}
            {content && (
                <div className="section-content" dangerouslySetInnerHTML={{ __html: content }} />
            )}
            {children && <div className="section-content">{children}</div>}
        </div>
    );
};

const InfiniteSolutionContent = ({ step }) => {
    const { equations, freeVars } = step;

    return (
        <div className="infinite-solution-content">
            <ParametricSolution step={step} />

            {equations && equations.length > 0 && (
                <SolutionSection type="equations" title="Pivot Variables in Terms of Free Variables">
                    {equations.map((eq, idx) => (
                        <div key={idx} className="equation-item info-box" dangerouslySetInnerHTML={{ __html: eq.display }} />
                    ))}
                </SolutionSection>
            )}

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
    const { particularSolution: xp, basisVectors, freeVars, variables: n } = step;

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