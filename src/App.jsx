import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import SetupPanel from './components/SetupPanel/SetupPanel';
import ResultsPanel from './components/ResultsPanel/ResultsPanel';
import ThemeSwitcher from './components/ThemeSwitcher/ThemeSwitcher';
import HomePage from './pages/HomePage/HomePage';
import AIPage from './pages/AIPage/AIPage';
import './styles/globals.css';
// import './styles/nav.css';

function NavBar({ onBack, showBack }) {
	const navigate = useNavigate();
	const location = useLocation();

	const links = [
		{ label: 'Home', path: '/' },
		{ label: 'AI Agent', path: '/ai' },
		{ label: 'Playground', path: '/playground' },
	];

	return (
		<header className="navbar">
			<div className="navbar-inner container">
				<button className="navbar-logo" onClick={() => navigate('/')}>
					Matrix Playground
				</button>

				<nav className="navbar-links">
					{links.map(({ label, path }) => (
						<button
							key={path}
							className={`nav-link ${location.pathname === path ? 'active' : ''}`}
							onClick={() => navigate(path)}
						>
							{label}
						</button>
					))}
				</nav>

				<div className="navbar-actions">
					<ThemeSwitcher />
					<a
						href="https://github.com/Lethargy2718/matrix-playground"
						target="_blank"
						rel="noreferrer"
						className="nav-github"
						aria-label="GitHub"
					>
						<i className="fa-brands fa-github"></i>
					</a>
				</div>
			</div>
		</header>
	);
}

function PlaygroundPage() {
	const navigate = useNavigate();
	const [currentView, setCurrentView] = useState('setup');
	const [solverData, setSolverData] = useState(
		// pick up AI-passed data from navigation state
		() => {
			try {
				const saved = sessionStorage.getItem('aiMatrixData');
				if (saved) { sessionStorage.removeItem('aiMatrixData'); return JSON.parse(saved); }
			} catch { }
			return null;
		}
	);
	const [prefill, setPrefill] = useState(() => {
		try {
			const saved = sessionStorage.getItem('aiPrefill');
			if (saved) { sessionStorage.removeItem('aiPrefill'); return JSON.parse(saved); }
		} catch { }
		return null;
	});

	const handleSolve = (data) => {
		setSolverData(data);
		setCurrentView('results');
	};

	const handleBack = () => {
		setCurrentView('setup');
		setSolverData(null);
		setPrefill(null);
	};

	return (
		<div className="main">
			<div className="container">
				<div className="main-content">
					{currentView === 'setup' ? (
						<SetupPanel onSolve={handleSolve} prefill={prefill} />
					) : (
						<ResultsPanel solverData={solverData} onBack={handleBack} />
					)}
				</div>
			</div>
		</div>
	);
}

function AppRoutes() {
	const location = useLocation();

	return (
		<>
			<NavBar />
			<div style={{ overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
				<div key={location.pathname} style={{ animation: 'pageIn 0.3s ease-out', flex: 1 }}>
					<Routes location={location}>
						<Route path="/" element={<HomePage />} />
						<Route path="/ai" element={<AIPage />} />
						<Route path="/playground" element={<PlaygroundPage />} />
					</Routes>
				</div>
			</div>
		</>
	);
}

export default function App() {
	return (
		<BrowserRouter>
			<AppRoutes />
		</BrowserRouter>
	);
}