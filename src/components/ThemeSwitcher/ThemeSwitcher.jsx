import { useEffect } from "react";
import "./ThemeSwitcher.css";

const key = 'theme';

export default function ThemeSwitcher() {
    const handleThemeChange = (event) => {
        const theme = event.target.value;
        document.documentElement.className = theme;
        localStorage.setItem(key, theme);
    };

    useEffect(() => {
        const saved = localStorage.getItem(key) || 'theme-green';
        document.documentElement.className = saved;
    }, []);

    return (
        <div className="theme-switcher">
            <select onChange={handleThemeChange} defaultValue={localStorage.getItem(key)}>
                <option value="theme-green">Dark Green</option>
                <option value="theme-slate">Slate</option>
                <option value="theme-crimson">Crimson</option>
                <option value="theme-sunset">Sunset</option>
                <option value="theme-neon">Neon</option>
                <option value="theme-blue">Dark Blue</option>
                <option value="theme-light">Light</option>
            </select>
        </div>
    );
}
