import {StoryEngine} from "./engine.js";
import {sound} from "./audio.js";

let isTyping = false;
let skipTypewriter = false;
const engine = new StoryEngine();
const sceneChapterEl = document.getElementById('scene-chapter');
const sceneTitleEl = document.getElementById('scene-title');
const storyContentEl = document.getElementById('story-content');
const choicesContainerEl = document.getElementById('choices-container');
const itemBannerEl = document.getElementById('item-banner');
const itemBannerTextEl = document.getElementById('item-banner-text');
const journalDrawerEl = document.getElementById('journal-drawer');
const journalToggleBtn = document.getElementById('journal-toggle-btn');
const journalCloseBtn = document.getElementById('journal-close-btn');
const journalBackdropEl = document.getElementById('journal-backdrop');
const journalBadgeEl = document.getElementById('journal-badge');
const cluesListEl = document.getElementById('clues-list');
const inventoryListEl = document.getElementById('inventory-list');
const rewindBtn = document.getElementById('rewind-btn');
const restartBtn = document.getElementById('restart-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const audioToggleBtn = document.getElementById('audio-toggle-btn');
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI'];
async function renderScene(scene, state) {
    if (!scene) return;
    sound.playDistantThunder();
    sceneChapterEl.textContent = scene.chapter || 'Chapter';
    sceneTitleEl.textContent = scene.title || 'Untitled';
    choicesContainerEl.style.opacity = '0';
    choicesContainerEl.style.pointerEvents = 'none';
    storyContentEl.innerHTML = '';
    isTyping = true;
    skipTypewriter = false;
    for (let i = 0; i < scene.text.length; i++) {
        const p = document.createElement('p');
        p.className = 'story-paragraph';
        if (i === 0) p.classList.add('drop-cap');
        storyContentEl.appendChild(p);
        const fullText = scene.text[i];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = fullText;
        const rawText = tempDiv.textContent || tempDiv.innerText || '';
        if (skipTypewriter) {
            p.innerHTML = fullText;
            continue;
        }
        let charIndex = 0;
        await new Promise(resolve => {
            const interval = setInterval(() => {
                if (skipTypewriter || charIndex >= rawText.length) {
                    clearInterval(interval);
                    p.innerHTML = fullText;
                    resolve();
                    return;
                }
                p.textContent += rawText[charIndex];
                if (charIndex % 6 === 0) {
                    sound.playQuillScratch();
                }
                charIndex++;
            }, 18);
        });
    }
    isTyping = false;
    if (scene.item) {
        itemBannerEl.classList.remove('hidden');
        itemBannerTextEl.textContent = `Discovered: ${scene.item.name} — ${scene.item.description}`;
    } else {
        itemBannerEl.classList.add('hidden');
    }
    choicesContainerEl.innerHTML = '';
    if (scene.choices && scene.choices.length > 0) {
        scene.choices.forEach((choice, index) => {
            const isUnlocked = engine.canChoose(choice);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'choice-card';
            const bullet = ROMAN_NUMERALS[index] || (index + 1);
            if (!isUnlocked) {
                button.classList.add('choice-locked');
                button.disabled = true;
                button.innerHTML = `
                <span class="choice-bullet">${bullet}</span>
                <span class="choice-text">
                <em>[Locked]</em> ${choice.text}
                <small class="lock-hint">(Requires missing item)</small>
            </span>
         `;
            } else {
                button.innerHTML = `
                <span class="choice-bullet">${bullet}</span>
                <span class="choice-text">${choice.text}</span>
            `;
                button.addEventListener('click', () => {
                    sound.playDistantThunder();
                    engine.makeChoice(index);
                    window.scrollTo({top: 0, behavior: 'smooth'});
                });
            }
            choicesContainerEl.appendChild(button);
        });
    }
    choicesContainerEl.style.transition = 'opacity 0.4s ease';
    choicesContainerEl.style.opacity = '1';
    choicesContainerEl.style.pointerEvents = 'auto';
    updateJournal(state);
}
function updateJournal(state) {
    const totalEvidence = state.inventory.length + state.clues.length;
    journalBadgeEl.textContent = totalEvidence;
    cluesListEl.innerHTML = '';
    if (state.clues.length === 0) {
        cluesListEl.innerHTML = '<li class="empty-entry">No clues logged yet. Scour your surroundings.</li>';
    } else {
        state.clues.forEach(clue => {
            const li = document.createElement('li');
            li.textContent = clue;
            cluesListEl.appendChild(li);
        });
    }
    inventoryListEl.innerHTML = '';
    if (state.inventory.length === 0) {
        inventoryListEl.innerHTML = '<span class="empty-entry">Your satchel is empty.</span>';
    } else {
        state.inventory.forEach(item => {
            const chip = document.createElement('div');
            chip.className = 'inventory-card';
            chip.innerHTML = `
            <span class="inventory-card-title">${item.name}</span>
            <span class="inventory-card-desc">${item.description}</span>
          `;
            inventoryListEl.appendChild(chip);
        });
    }
    if (state.history.length === 0) {
        rewindBtn.disabled = true;
        rewindBtn.style.opacity = '0.5';
        rewindBtn.style.cursor = 'not-allowed';
    } else {
        rewindBtn.disabled = false;
        rewindBtn.style.opacity = '1';
        rewindBtn.style.cursor = 'pointer';
    }
}
function openJournal() {
    journalDrawerEl.classList.add('open');
    journalDrawerEl.removeAttribute('aria-hidden');
    journalDrawerEl.removeAttribute('inert');
    journalCloseBtn.focus();
}
function closeJournal() {
    if (document.activeElement && journalDrawerEl.contains(document.activeElement)) {
        document.activeElement.blur();
    }
    journalToggleBtn.focus();
    journalDrawerEl.classList.remove('open');
    journalDrawerEl.setAttribute('aria-hidden', 'true');
    journalDrawerEl.setAttribute('inert', '');
}
journalToggleBtn.addEventListener('click', openJournal);
journalCloseBtn.addEventListener('click', closeJournal);
journalBackdropEl.addEventListener('click', closeJournal);
rewindBtn.addEventListener('click', () => {
    if (engine.rewind()) {
        closeJournal();
    }
});
restartBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to restart your investigation from the gates?')) {
        engine.restart();
        closeJournal();
    }
});
const THEME_KEY = 'inkwell_theme';
const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
function setTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem(THEME_KEY, theme);
}
themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setTheme(isDark ? 'light' : 'dark');
});
setTheme(savedTheme);
document.querySelector('.parchment-sheet')?.addEventListener('click', () => {
    if (isTyping) {
        skipTypewriter = true;
    }
});
function updateAudioButtonUI() {
    const audioIcon = document.getElementById('audio-icon');
    if (!audioIcon) return;
    if (sound.isMuted) {
        audioIcon.innerHTML = `
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <line x1="23" y1="9" x2="17" y2="15"/>
        <line x1="17" y1="9" x2="23" y2="15"/>
     `;
    } else {
        audioIcon.innerHTML = `
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M15.54 8.46a 5 5 0 0 1 0 7.07"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
     `;
    }
}
audioToggleBtn.addEventListener('click', () => {
    sound.toggleMute();
    updateAudioButtonUI();
    if (!sound.isMuted) {
        sound.playWaxStamp();
    }
});
updateAudioButtonUI();
engine.onStateChange((scene, state) => {
    renderScene(scene, state);
});
async function init() {
    try {
        await engine.loadStory();
        renderScene(engine.getCurrentScene(), engine.state);
    } catch (error) {
        storyContentEl.innerHTML = `
        <p class="story-paragraph" style="color: var(--accent-crimson);">
        Failed to load the case records. Ensure you are running through a local web server (e.g. WebStorm Live Server) so <code>data/story.json</code> can be fetched.
</p>
`;
    }
}
init();