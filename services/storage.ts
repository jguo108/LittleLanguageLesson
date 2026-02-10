const STORAGE_KEY_PREFIX = 'snaplearn_words_';

export const getSavedWords = (userId: string): string[] => {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load words", e);
    return [];
  }
};

export const saveWord = (userId: string, word: string): void => {
  try {
    const words = getSavedWords(userId);
    // Avoid duplicates, move to top
    const newWords = [word, ...words.filter(w => w.toLowerCase() !== word.toLowerCase())];
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(newWords));
  } catch (e) {
    console.error("Failed to save word", e);
  }
};

export const deleteWord = (userId: string, wordToDelete: string): string[] => {
  try {
    const words = getSavedWords(userId);
    const newWords = words.filter(w => w !== wordToDelete);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(newWords));
    return newWords;
  } catch (e) {
    console.error("Failed to delete word", e);
    return [];
  }
};