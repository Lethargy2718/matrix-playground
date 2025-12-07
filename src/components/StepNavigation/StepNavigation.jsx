import { useState, useEffect, useRef } from 'react';
import './StepNavigation.css';

const StepNavigation = ({
    currentStepIndex,
    totalSteps,
    onPrevious,
    onNext,
    onStart,
    onEnd,
    onInput,
}) => {
    const [tempValue, setTempValue] = useState(currentStepIndex + 1);
    const [isStuck, setIsStuck] = useState(false);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    // TODO: switch to InteractionObserver
    useEffect(() => {
        const handleScroll = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setIsStuck(rect.top <= 10);
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setTempValue(currentStepIndex + 1);
    }, [currentStepIndex]);

    useEffect(() => {
        if (inputRef.current) {
            const len = String(tempValue).length || 1;
            inputRef.current.style.width = `${len + 0.75}ch`;
        }
    }, [tempValue]);

    const commitValue = (e) => {
        const val = Number(e.target.value);
        if (Number.isFinite(val)) {
            onInput(e);
        } else {
            setTempValue(currentStepIndex + 1);
        }
    };

    return (
        <div ref={containerRef} className={`step-controls shadow ${isStuck ? 'stuck' : ''}`}>
            <div className="step-navigation">
                <button
                    className="btn-secondary nav-btn"
                    onClick={onStart}
                    disabled={currentStepIndex <= 0}
                >
                    ⏮
                </button>
                <button
                    className="btn-secondary nav-btn"
                    onClick={onPrevious}
                    disabled={currentStepIndex <= 0}
                >
                    ◀
                </button>

                <span id="step-counter">
                    <span className="desktop-nav">Step{' '}</span>
                    <input
                        ref={inputRef}
                        type="number"
                        className="navigation-input"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={commitValue}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') e.target.blur();
                        }}
                    />
                    <span className="desktop-nav">{' '}of</span>
                    <span className="mobile-nav">/</span> {totalSteps}
                </span>

                <button
                    className="btn-secondary nav-btn"
                    onClick={onNext}
                    disabled={currentStepIndex >= totalSteps - 1}
                >
                    ▶
                </button>
                <button
                    className="btn-secondary nav-btn"
                    onClick={onEnd}
                    disabled={currentStepIndex >= totalSteps - 1}
                >
                    ⏭
                </button>
            </div>
        </div>
    );
};

export default StepNavigation;
