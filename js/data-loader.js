class SecureDataLoader {
    static async loadBookData() {
        const CACHE_KEY = 'book_data_cache';
        const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
        
        // Check cache first
        const cached = this.getCachedData(CACHE_KEY, CACHE_DURATION);
        if (cached) return cached;
        
        try {
            // Use relative path to obscure the actual location
            const response = await fetch('../data/amazon-recommendations.json');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // Validate data structure
            if (!this.isValidBookData(data)) {
                throw new Error('Invalid data structure');
            }
            
            // Cache the data
            this.setCachedData(CACHE_KEY, data);
            
            return data;
            
        } catch (error) {
            console.warn('Failed to load book data:', error.message);
            return this.getFallbackData();
        }
    }
    
    static getCachedData(key, duration) {
        try {
            const cached = localStorage.getItem(key);
            if (!cached) return null;
            
            const { timestamp, data } = JSON.parse(cached);
            if (Date.now() - timestamp > duration) return null;
            
            return data;
        } catch {
            return null;
        }
    }
    
    static setCachedData(key, data) {
        try {
            const cache = {
                timestamp: Date.now(),
                data: data
            };
            localStorage.setItem(key, JSON.stringify(cache));
        } catch (error) {
            console.warn('Could not cache data:', error);
        }
    }
    
    static isValidBookData(data) {
        return data && 
               typeof data === 'object' &&
               'categories' in data &&
               'metadata' in data;
    }
    
    static getFallbackData() {
        return {
            categories: {},
            metadata: {
                totalBooks: 0,
                categoriesCount: 0,
                source: 'Fallback Data'
            },
            lastUpdated: new Date().toISOString()
        };
    }
}