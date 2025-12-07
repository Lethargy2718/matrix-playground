import "./ThemeSwitcher.css";

export default function ThemeSwitcher() {
    const handleThemeChange = (event) => {
        const theme = event.target.value;
        document.documentElement.className = theme;
    };

    return (
        <div className="theme-switcher">
            <select onChange={handleThemeChange} defaultValue="theme-slate">
                <option value="theme-slate">Slate</option>
                <option value="theme-green">Dark Green</option>
                <option value="theme-crimson">Crimson</option>
                <option value="theme-sunset">Sunset</option>
                <option value="theme-neon">Neon</option>
                <option value="theme-blue">Dark Blue</option>
                <option value="theme-light">Light</option>
            </select>
        </div>
    );
}
