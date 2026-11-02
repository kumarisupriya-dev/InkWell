const STORAGE_KEY = 'inkwell_case_bookmark';
export const storage = {
    saveBookmark(state) {
        try {
            const payload = {
                currentNodeId: state.currentNodeId,
                inventory: state.inventory,
                clues: state.clues,
                history: state.history,
                endingsUnlocked: state.endingsUnlocked,
                timestamp: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch (error) {
            console.error('Storage: Unable to save bookmark to localStorage', error);
        }
    },
    loadBookmark(state) {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (parsed && parsed.currentNodeId) {
                return parsed;
            }
            return null;
        } catch (error) {
            console.warn('Storage: Corrupt bookmark data, resetting', error);
            this.clearBookmark();
            return null;
        }
    },
    hasBookmark() {
        const bookmark = this.loadBookmark();
        if (!bookmark) return false;
        return bookmark.currentNodeId !== 'prologue' || bookmark.inventory.length > 0;
    },
    clearBookmark() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.warn('Storage: Error clearing bookmark', error);
        }
    }
};