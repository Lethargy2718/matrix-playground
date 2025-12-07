import { useState } from 'react';
import SetupPanel from './components/SetupPanel/SetupPanel';
import ResultsPanel from './components/ResultsPanel/ResultsPanel';
import './styles/globals.css';
import ThemeSwitcher from './components/ThemeSwitcher/ThemeSwitcher';
import BackgroundParticles from './components/BackgroundParticles/BackgroundParticles';

function App() {
	const [currentView, setCurrentView] = useState('setup');
	const [solverData, setSolverData] = useState(null);

	const handleSolve = (data) => {
		setSolverData(data);
		setCurrentView('results');
	};

	const handleBackToSetup = () => {
		setCurrentView('setup');
		setSolverData(null);
	};

	return (
		<>
			<div className="main">
				<div className="container">
					<header className="header">
						<ThemeSwitcher />
						<h1>System Solver</h1>
						<div className="header-links">
							{/* TODO: Link to repo instead */}
							<a href="https://github.com/Lethargy2718" target="_blank"><i className="fa-brands fa-github"></i></a>
						</div>
					</header>

					<div className="main-content">
						{currentView === 'setup' ? (
							<SetupPanel onSolve={handleSolve} />
						) : (
							<ResultsPanel
								solverData={solverData}
								onBack={handleBackToSetup}
							/>
						)}
					</div>
				</div>
			</div>
		</>
	);
}

export default App;