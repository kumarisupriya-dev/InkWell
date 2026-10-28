import {StoryEngine} from "./engine.js";

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
function renderScene(scene, state) {
    if (!scene) return;
    sceneChapterEl.textContent = scene.chapter || 'Chapter';
    sceneTitleEl.textContent = scene.title || 'Untitled';
    storyContentEl.innerHTML = '';
    scene.text.forEach((paragraphText, index) => {
        const p = document.createElement('p');
        p.className = 'story-paragraph';
        if (index === 0) {
            p.classList.add('drop-cap');
        }
        p.innerHTML = paragraphText;
        storyContentEl.appendChild(p);
    });
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
            </span>`;
            } else {
                button.innerHTML = `
                <span class="choice-bullet">${bullet}</span>
                <span class="choice-text">${choice.text}</span>
              `;
                button.addEventListener('click', () => {
                    engine.makeChoice(index);
                    window.scrollTo({top: 0, behavior: 'smooth'});
                });
            }
            choicesContainerEl.appendChild(button);
        });
    }
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
            chip.className = 'badge';
            chip.style.padding = '0.35rem 0.75rem';
            chip.style.fontSize = '0.85rem';
            chip.style.backgroundColor = 'var(--bg-parchment-subtle)';
            chip.style.color = 'var(--text-ink)';
            chip.style.border = '1px solid var(--border-parchment)';
            chip.title = item.description;
            chip.textContent = item.name;
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
audioToggleBtn.addEventListener('click', () => {
    alert('Rain & quill sound synthesis will be initialized in Phase 4!');
});
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