import { useState, useRef, useEffect } from 'react';
import './AIPanel.css';

const SYSTEM_PROMPT = `You are a math assistant that converts real-world problems (circuits, pipes, economics, etc.) into systems of linear equations, then outputs them as JSON.

RULES:
1. Extract ALL variables and ALL equations from the problem.
2. If the problem is INSUFFICIENT (missing values, under-determined, or ambiguous), respond with EXACTLY:
   {"error": "brief one-sentence explanation of what specific information is missing"}
3. If solvable, respond with EXACTLY this JSON and nothing else:
   {"matrix": [[a,b,...,rhs],[...],...], "labels": ["v1","v2",...], "solveType": "FULL"}
   - matrix rows = each equation, columns = coefficients in the SAME variable order, last column = RHS constant
   - labels = the actual variable names (e.g. ["I1","I2","I3"] for currents, ["x","y","z"] for generics)
   - solveType: "FULL" for word problems, "RREF" for pure matrix reduction, "REF" for row echelon only
4. If the user is just chatting or asking a question (not giving a problem), respond with a SHORT plain-text reply (no JSON) to help them give you a proper problem.
5. DO NOT include markdown, explanation, or any text outside the JSON when outputting a matrix or error.
6. ALL matrix values MUST be evaluated decimal numbers. Never use fractions, expressions, or arithmetic like "1/4 + 1/2". Compute them first: 1/4 + 1/2 = 0.75, write 0.75.
`;

export default function AIPanel({ onMatrixReady }) {
    const [messages, setMessages] = useState([
        {
            role: 'ai',
            type: 'text',
            text: "Describe your system in plain language — a circuit, a network of pipes, a set of word problems, anything. I'll pull out the equations and fill in the matrix for you.",
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatRef = useRef(null);
    const textareaRef = useRef(null);
    const historyRef = useRef([]);

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    const autoResize = (el) => {
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || loading) return;

        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        const userMsg = { role: 'user', type: 'text', text };
        historyRef.current.push({ role: 'user', content: text });
        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);

        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system: SYSTEM_PROMPT,
                    messages: historyRef.current,
                }),
            });

            const data = await res.json();
            const raw = (data.content || [])
                .filter((b) => b.type === 'text')
                .map((b) => b.text)
                .join('');

            historyRef.current.push({ role: 'assistant', content: raw });

            let parsed;
            try {
                parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
            } catch {
                setMessages((prev) => [...prev, { role: 'ai', type: 'text', text: raw }]);
                setLoading(false);
                return;
            }

            if (parsed.error) {
                setMessages((prev) => [
                    ...prev,
                    { role: 'ai', type: 'error', text: parsed.error },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    { role: 'ai', type: 'matrix', data: parsed },
                ]);
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: 'ai', type: 'error', text: 'Connection error. Please try again.' },
            ]);
        }

        setLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleApply = (parsed) => {
        const { matrix, solveType } = parsed;
        const equations = matrix.length;
        const variables = matrix[0].length - 1;
        const matrixData = matrix.map((row) => ({
            coefficients: row.slice(0, -1).map(String),
            constant: String(row[row.length - 1]),
        }));
        onMatrixReady({ equations, variables, matrixData, solveType: solveType || 'FULL' });
    };

    return (
        <div className="ai-panel shadow">
            <div className="ai-panel-header">
                <span className="ai-icon">✦</span>
                <span className="ai-title">Describe your problem</span>
                <span className="ai-badge">AI</span>
            </div>

            <div className="ai-chat" ref={chatRef}>
                {messages.map((msg, i) => (
                    <div key={i} className={`ai-msg ${msg.role}`}>
                        <div className={`ai-avatar ${msg.role}`}>
                            {msg.role === 'ai' ? '✦' : 'U'}
                        </div>

                        {msg.type === 'text' && (
                            <div className="ai-bubble">{msg.text}</div>
                        )}

                        {msg.type === 'error' && (
                            <div className="ai-bubble ai-bubble--error">
                                ⚠ {msg.text}
                            </div>
                        )}

                        {msg.type === 'matrix' && (
                            <div className="ai-bubble">
                                <p className="ai-result-intro">
                                    Got it — here's the system I extracted:
                                </p>
                                <div className="ai-result-card">
                                    <div className="ai-result-label">
                                        {msg.data.matrix.length} equation
                                        {msg.data.matrix.length !== 1 ? 's' : ''},{' '}
                                        {msg.data.matrix[0].length - 1} variable
                                        {msg.data.matrix[0].length - 1 !== 1 ? 's' : ''}
                                    </div>
                                    <table className="ai-result-table">
                                        <tbody>
                                            {msg.data.matrix.map((row, ri) => {
                                                const coeffs = row.slice(0, -1);
                                                const rhs = row[row.length - 1];
                                                const labels = msg.data.labels || coeffs.map((_, j) => `x${j + 1}`);
                                                return (
                                                    <tr key={ri}>
                                                        <td className="eq-label">L{ri + 1}</td>
                                                        <td>
                                                            {coeffs.map((c, j) => (
                                                                <span key={j}>
                                                                    {j > 0 && (
                                                                        <span className="eq-op">
                                                                            {c >= 0 ? ' + ' : ' − '}
                                                                        </span>
                                                                    )}
                                                                    <span className="eq-coeff">
                                                                        {j === 0 ? c : Math.abs(c)}
                                                                    </span>
                                                                    <span className="eq-var">
                                                                        {labels[j]}
                                                                    </span>
                                                                </span>
                                                            ))}
                                                            <span className="eq-op"> = </span>
                                                            <span className="eq-rhs">{rhs}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    <button
                                        className="btn-primary ai-apply-btn"
                                        onClick={() => handleApply(msg.data)}
                                    >
                                        Load into solver →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="ai-msg ai">
                        <div className="ai-avatar ai">✦</div>
                        <div className="ai-bubble">
                            <div className="ai-typing">
                                <span /><span /><span />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="ai-input-row">
                <textarea
                    ref={textareaRef}
                    className="ai-textarea"
                    rows={1}
                    placeholder="e.g. I have a circuit with 3 loops…"
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        autoResize(e.target);
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                />
                <button
                    className="ai-send-btn"
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    aria-label="Send"
                >
                    ↑
                </button>
            </div>
        </div>
    );
}