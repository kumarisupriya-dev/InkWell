export class StoryEngine {
    constructor() {
        this.storyData = null;
        this.state = {
            currentNodeId: 'prologue',
            inventory: [],
            clues: [],
            history: [],
            endingsUnlocked: []
        };
        this.onStateChangeCallbacks = [];
        this.onItemDiscoveredCallbacks = [];
    }
    async loadStory() {
        try {
            const response = await fetch('data/story.json');
            if (!response.ok) {
                throw new Error(`Failed to load story.json (status ${response.status})`);
            }
            this.storyData = await response.json();
            this.state.currentNodeId = this.storyData.startNode || 'prologue';
            this.processCurrentSceneDiscoveries();
            return this.storyData;
        } catch (error) {
            console.error('StoryEngine Error loading story:', error);
            throw error;
        }
    }
    getCurrentScene() {
        if (!this.storyData || !this.storyData.scenes) {
            return null;
        }
        return this.storyData.scenes[this.state.currentNodeId] || null;
    }
    canChoose(choice) {
        if (!choice.requireItem) {
            return true;
        }
        return this.hasItem(choice.requiresItem);
    }
    hasItem(itemId) {
        return this.state.inventory.some(item => item.id === itemId);
    }
    makeChoice(choiceIndex) {
        const scene = this.getCurrentScene();
        if (!scene || !scene.choices || !scene.choices[choiceIndex]) {
            console.warn('Invalid choice index:', choiceIndex);
            return false;
        }
        const choice = scene.choices[choiceIndex];
        if (!this.canChoose(choice)) {
            console.warn('Choice is locked. Missing required item:', choice.requiresItem);
            return false;
        }
        this.state.history.push(this.state.currentNodeId);
        this.state.currentNodeId = choice.target;
        this.processCurrentSceneDiscoveries();
        this.notifyStateChange();
        return true;
    }
    processCurrentSceneDiscoveries() {
        const scene = this.getCurrentScene();
        if (!scene) return;
        if (scene.item && !this.hasItem(scene.item.id)) {
            this.state.inventory.push(scene.item);
            this.notifyItemDiscovered(scene.item);
        }
        if (scene.clue && !this.state.clues.includes(scene.clue)) {
            this.state.clues.push(scene.clue);
        }
        if (scene.isEnding && !this.state.endingsUnlocked.includes(scene.endingType)) {
            this.state.endingsUnlocked.push(scene.endingType);
        }
    }
    rewind() {
        if (this.state.history.length === 0) {
            return false;
        }
        const previousNodeId = this.state.history.pop();
        this.state.currentNodeId = previousNodeId;
        this.notifyStateChange();
        return true;
    }
    restart() {
        this.state.currentNodeId = this.storyData ? this.storyData.startNode : 'prologue';
        this.state.inventory = [];
        this.state.clues = [];
        this.state.history = [];
        this.processCurrentSceneDiscoveries();
        this.notifyStateChange();
    }
    onStateChange(callback) {
        this.onStateChangeCallbacks.push(callback);
    }
    onItemDiscovered(callback) {
        this.onItemDiscoveredCallbacks.push(callback);
    }
    notifyStateChange() {
        const currentScene = this.getCurrentScene();
        this.onStateChangeCallbacks.forEach(cb => cb(currentScene, this.state));
    }
    notifyItemDiscovered(item) {
        this.onItemDiscoveredCallbacks.forEach(cb => cb(item));
    }
}