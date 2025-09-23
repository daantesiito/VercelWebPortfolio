interface FakeStorage {
  _data: { [key: string]: string };
  setItem: (id: string, val: string) => string;
  getItem: (id: string) => string | undefined;
  removeItem: (id: string) => boolean;
  clear: () => { [key: string]: string };
}

const fakeStorage: FakeStorage = {
  _data: {},

  setItem: function (id: string, val: string): string {
    return this._data[id] = String(val);
  },

  getItem: function (id: string): string | undefined {
    return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
  },

  removeItem: function (id: string): boolean {
    return delete this._data[id];
  },

  clear: function (): { [key: string]: string } {
    return this._data = {};
  }
};

export class LocalStorageManager {
  bestScoreKey: string = "bestScore";
  gameStateKey: string = "gameState";
  storage: Storage | FakeStorage;

  constructor() {
    const supported = this.localStorageSupported();
    this.storage = supported ? window.localStorage : fakeStorage;
  }

  localStorageSupported(): boolean {
    if (typeof window === 'undefined') return false;

    const testKey = "test";

    try {
      const storage = window.localStorage;
      storage.setItem(testKey, "1");
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Best score getters/setters
  getBestScore(): number {
    return parseInt(this.storage.getItem(this.bestScoreKey) || '0') || 0;
  }

  setBestScore(score: number): void {
    this.storage.setItem(this.bestScoreKey, score.toString());
  }

  // Game state getters/setters and clearing
  getGameState(): any {
    const stateJSON = this.storage.getItem(this.gameStateKey);
    return stateJSON ? JSON.parse(stateJSON) : null;
  }

  setGameState(gameState: any): void {
    this.storage.setItem(this.gameStateKey, JSON.stringify(gameState));
  }

  clearGameState(): void {
    this.storage.removeItem(this.gameStateKey);
  }
}
