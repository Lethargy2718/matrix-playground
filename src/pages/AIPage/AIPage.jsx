import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AIPage.css';

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
   - ALL matrix values MUST be evaluated decimal numbers. Never use fractions or expressions like "1/4 + 1/2". Compute them: 0.75.
4. If the user is just chatting or asking a question (not giving a problem), respond with a SHORT plain-text reply (no JSON) to help them give you a proper problem.
5. OUTPUT ONLY THE RAW JSON. No words before it, no words after it, no explanation, no "here is", no markdown. If your response contains anything other than a single JSON object, it is wrong.
6. For series/parallel circuits, use Ohm's law and KVL/KCL to derive the equations yourself. Don't ask for more info if the problem is solvable with basic circuit laws.`;

export default function AIPage() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        {
            role: 'ai',
            type: 'text',
            text: "Describe your system in plain language — a circuit, a network of pipes, a word problem, anything. I'll extract the equations and send them straight to the solver.",
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatRef = useRef(null);
    const textareaRef = useRef(null);
    const historyRef = useRef([]);

    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [messages]);

    const autoResize = (el) => {
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 140) + 'px';
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || loading) return;

        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        historyRef.current.push({ role: 'user', content: text });
        setMessages(prev => [...prev, { role: 'user', type: 'text', text }]);
        setLoading(true);

        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ system: SYSTEM_PROMPT, messages: historyRef.current }),
            });

            const data = await res.json();
            const raw = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
            historyRef.current.push({ role: 'assistant', content: raw });

            let parsed;
            try {
                parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
            } catch {
                setMessages(prev => [...prev, { role: 'ai', type: 'text', text: raw }]);
                setLoading(false);
                return;
            }

            if (parsed.error) {
                setMessages(prev => [...prev, { role: 'ai', type: 'error', text: parsed.error }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', type: 'matrix', data: parsed }]);
            }
        } catch {
            setMessages(prev => [...prev, { role: 'ai', type: 'error', text: 'Connection error. Please try again.' }]);
        }

        setLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const handleLoad = (parsed) => {
        const { matrix, solveType } = parsed;
        const equations = matrix.length;
        const variables = matrix[0].length - 1;
        const matrixData = matrix.map(row => ({
            coefficients: row.slice(0, -1).map(String),
            constant: String(row[row.length - 1]),
        }));
        sessionStorage.setItem('aiPrefill', JSON.stringify({ equations, variables, matrixData, solveType: solveType || 'FULL' }));
        navigate('/playground');
    };

    return (
        <div className="ai-page container">
            <div className="ai-page-inner">
                <div className="ai-page-header">
                    <h2>AI Agent</h2>
                    <p>Describe any system in plain English — circuit analysis, economics, chemistry, word problems. The AI extracts the equations and loads them into the solver.</p>
                </div>

                <div className="ai-page-chat" ref={chatRef}>
                    {messages.map((msg, i) => (
                        <div key={i} className={`aip-msg ${msg.role}`}>
                            <div className={`aip-avatar ${msg.role}`}>
                                {msg.role === 'ai' ? '✦' : 'U'}
                            </div>

                            {msg.type === 'text' && (
                                <div className="aip-bubble">{msg.text}</div>
                            )}

                            {msg.type === 'error' && (
                                <div className="aip-bubble aip-bubble--error">⚠ {msg.text}</div>
                            )}

                            {msg.type === 'matrix' && (
                                <div className="aip-bubble aip-bubble--result">
                                    <p className="aip-result-intro">Got it — here's the system I extracted:</p>
                                    <div className="aip-result-card">
                                        <div className="aip-result-meta">
                                            {msg.data.matrix.length} equation{msg.data.matrix.length !== 1 ? 's' : ''}, {msg.data.matrix[0].length - 1} variable{msg.data.matrix[0].length - 1 !== 1 ? 's' : ''}
                                            {msg.data.labels && (
                                                <span className="aip-result-vars"> — {msg.data.labels.join(', ')}</span>
                                            )}
                                        </div>
                                        <table className="aip-eq-table">
                                            <tbody>
                                                {msg.data.matrix.map((row, ri) => {
                                                    const coeffs = row.slice(0, -1);
                                                    const rhs = row[row.length - 1];
                                                    const labels = msg.data.labels || coeffs.map((_, j) => `x${j + 1}`);
                                                    return (
                                                        <tr key={ri}>
                                                            <td className="aip-eq-label">L{ri + 1}</td>
                                                            <td className="aip-eq-body">
                                                                {coeffs.map((c, j) => (
                                                                    <span key={j}>
                                                                        {j > 0 && <span className="aip-op">{c >= 0 ? ' + ' : ' − '}</span>}
                                                                        <span className="aip-coeff">{j === 0 ? c : Math.abs(c)}</span>
                                                                        <span className="aip-var">{labels[j]}</span>
                                                                    </span>
                                                                ))}
                                                                <span className="aip-op"> = </span>
                                                                <span className="aip-rhs">{rhs}</span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        <button className="aip-load-btn" onClick={() => handleLoad(msg.data)}>
                                            Open in solver →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="aip-msg ai">
                            <div className="aip-avatar ai">✦</div>
                            <div className="aip-bubble">
                                <div className="aip-typing"><span /><span /><span /></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="ai-page-input">
                    <textarea
                        ref={textareaRef}
                        className="aip-textarea"
                        rows={1}
                        placeholder="e.g. A factory makes chairs, tables and shelves with limited labor hours…"
                        value={input}
                        onChange={e => { setInput(e.target.value); autoResize(e.target); }}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                    />
                    <button
                        className="aip-send"
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        aria-label="Send"
                    >
                        <i className="fa-solid fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    );
}