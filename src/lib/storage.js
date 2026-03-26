
const STORAGE_KEYS = {
  BOTS: 'autobots_bots',
  HISTORY: 'autobots_history',
  SETTINGS: 'autobots_settings',
};

// Generic storage helper
const storage = {
  get: (key, defaultValue = []) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key} to storage:`, e);
    }
  },
};

// Mimics the base44 entities API
export const entities = {
  TradingBot: {
    list: async (sort = '') => {
      let bots = storage.get(STORAGE_KEYS.BOTS);
      // Simple sort by date if needed
      if (sort.includes('updated_date')) {
        bots.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
      }
      return bots;
    },
    get: async (id) => {
      const bots = storage.get(STORAGE_KEYS.BOTS);
      return bots.find(b => b.id === id);
    },
    create: async (data) => {
      const bots = storage.get(STORAGE_KEYS.BOTS);
      const newBot = {
        ...data,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: data.status || 'stopped',
      };
      storage.set(STORAGE_KEYS.BOTS, [...bots, newBot]);
      return newBot;
    },
    update: async (id, data) => {
      const bots = storage.get(STORAGE_KEYS.BOTS);
      const index = bots.findIndex(b => b.id === id);
      if (index === -1) throw new Error('Bot not found');
      
      const updatedBot = {
        ...bots[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      
      const newBots = [...bots];
      newBots[index] = updatedBot;
      storage.set(STORAGE_KEYS.BOTS, newBots);
      return updatedBot;
    },
    delete: async (id) => {
      const bots = storage.get(STORAGE_KEYS.BOTS);
      const newBots = bots.filter(b => b.id !== id);
      storage.set(STORAGE_KEYS.BOTS, newBots);
      return true;
    }
  },
  TradeHistory: {
    list: async (sort = '') => {
      const history = storage.get(STORAGE_KEYS.HISTORY);
      if (sort.includes('created_date')) {
        history.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      }
      return history;
    },
    create: async (data) => {
      const history = storage.get(STORAGE_KEYS.HISTORY);
      const newEntry = {
        ...data,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };
      // Keep only last 1000 entries to prevent localStorage bloat
      const newHistory = [newEntry, ...history].slice(0, 1000);
      storage.set(STORAGE_KEYS.HISTORY, newHistory);
      return newEntry;
    },
    clear: async () => {
      storage.set(STORAGE_KEYS.HISTORY, []);
      return true;
    }
  }
};

// App settings and Auth replacement
export const localAuth = {
  getAccount: () => {
    return storage.get(STORAGE_KEYS.SETTINGS, null);
  },
  saveAccount: (accountData) => {
    storage.set(STORAGE_KEYS.SETTINGS, accountData);
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  }
};
