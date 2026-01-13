// 1. IMPORT YOUR SECTIONS
import { Header } from './sections/header.js';
import { Hero } from './sections/hero.js';
import { Ticker } from './sections/ticker.js';
import { Leaderboard } from './sections/leaderboard.js';
import { Services } from './sections/services.js';
import { Process } from './sections/process.js';
import { Footer } from './sections/footer.js';

// 2. INJECT INTO THE HTML
const app = document.getElementById('app');
app.innerHTML = `
    ${Header}
    ${Hero}
    ${Ticker}
    ${Leaderboard}
    ${Services}
    ${Process}
    ${Footer}
`;

// 3. THE MAIN LOGIC (SCROLL & REVEAL)
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.3 
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Trigger the slide-up animation
            entry.target.classList.add('active');
            
            // Switch body background color
            const newBg = entry.target.getAttribute('data-bg');
            if (newBg) {
                document.body.style.backgroundColor = newBg;
            }
        }
    });
}, observerOptions);

// Apply to all sections with the 'reveal' class
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Reset background to pure black at the top
window.addEventListener('scroll', () => {
    if (window.scrollY < 100) {
        document.body.style.backgroundColor = "#000000";
    }
});
