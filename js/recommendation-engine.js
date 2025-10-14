// js/recommendation-engine.js
class RecommendationEngine {
    static async generateRecommendations() {
        try {
            console.log('Loading book recommendations...');
            
            // Load both local books and Amazon recommendations
            const [localBooks, amazonData] = await Promise.all([
                this.loadLocalBooks(),
                this.loadAmazonData()
            ]);
            
            console.log(`Found ${localBooks.length} local books and ${this.countAmazonBooks(amazonData)} Amazon recommendations`);
            
            // Generate recommendations based on popularity and diversity
            const localRecommendations = this.getPopularBooks(localBooks, 'local');
            const amazonRecommendations = this.getTrendingBooks(amazonData);
            
            // Combine with priority to local books
            const allRecommendations = [
                ...localRecommendations.slice(0, 6), // Top 6 local books
                ...amazonRecommendations.slice(0, 6) // Top 6 Amazon books
            ];
            
            // Shuffle to mix local and Amazon books
            const shuffledRecommendations = this.shuffleArray(allRecommendations)
                .slice(0, 12); // Return 12 mixed recommendations
            
            console.log(`Generated ${shuffledRecommendations.length} recommendations`);
            return shuffledRecommendations;
            
        } catch (error) {
            console.error('Recommendation engine error:', error);
            return await this.getFallbackRecommendations();
        }
    }

    static getPopularBooks(books, source = 'local') {
        return books.map(book => ({
            ...book,
            source: source,
            score: this.calculatePopularityScore(book, source),
            imageUrl: this.getBookImageUrl(book, source),
            productUrl: this.getBookProductUrl(book, source),
            category: this.getBookCategory(book, source)
        }))
        .sort((a, b) => b.score - a.score);
    }

    static getTrendingBooks(amazonData) {
        if (!amazonData.categories) return [];
        
        const allAmazonBooks = Object.values(amazonData.categories).flat();
        return this.getPopularBooks(allAmazonBooks, 'amazon');
    }

    static calculatePopularityScore(book, source) {
        let score = 0;

        // Source priority - local books get higher base score
        if (source === 'local') {
            score += 100; // High priority for our own books
            
            // Featured books get bonus
            if (book.featured) {
                score += 50;
            }
            
            // Books with download links get bonus
            if (book.download_links && Object.keys(book.download_links).length > 0) {
                score += 30;
            }
            
            // Recent books bonus (5 points per year from current year)
            if (book.year) {
                const currentYear = new Date().getFullYear();
                const yearsAgo = currentYear - book.year;
                if (yearsAgo <= 5) {
                    score += (5 - yearsAgo) * 10;
                }
            }
            
        } else {
            // Amazon books scoring
            score += 50; // Base score for Amazon books
            
            // Rating-based scoring
            if (book.rating && book.rating !== 'No rating') {
                const rating = parseFloat(book.rating);
                if (!isNaN(rating)) {
                    score += rating * 15; // 15 points per star
                }
            }
            
            // Price scoring - prefer affordable books
            if (book.price && book.price !== 'Price not available') {
                const priceMatch = book.price.match(/\$(\d+)/);
                if (priceMatch) {
                    const price = parseInt(priceMatch[1]);
                    if (price < 10) score += 20;
                    else if (price < 20) score += 10;
                }
            }
        }

        // Genre diversity bonus
        const genreBonus = this.getGenreDiversityBonus(book.genre || book.category);
        score += genreBonus;

        // Random factor for variety (0-15 points)
        score += Math.random() * 15;

        return score;
    }

    static getGenreDiversityBonus(genre) {
        const genreWeights = {
            'self-help': 25,
            'programming': 20,
            'fiction': 15,
            'business': 20,
            'science_tech': 15,
            'mystery_thriller': 15,
            'biography': 10,
            'design': 10,
            'drama': 10
        };
        
        const genreKey = genre ? genre.toLowerCase().replace(' ', '_') : 'general';
        return genreWeights[genreKey] || 5;
    }

    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    static async loadLocalBooks() {
        try {
            const response = await fetch('/data/books.json');
            if (!response.ok) throw new Error('Failed to load local books');
            const booksData = await response.json();
            
            if (!Array.isArray(booksData)) {
                throw new Error('Invalid books data format');
            }
            
            console.log('Successfully loaded local books data');
            return booksData;
            
        } catch (error) {
            console.error('Error loading local books:', error);
            return [];
        }
    }

    static async loadAmazonData() {
        try {
            const response = await fetch('/data/amazon-recommendations.json');
            if (!response.ok) throw new Error('Failed to load Amazon recommendations');
            const data = await response.json();
            
            if (!data.categories || typeof data.categories !== 'object') {
                throw new Error('Invalid data structure in Amazon recommendations');
            }
            
            console.log('Successfully loaded Amazon data');
            return data;
            
        } catch (error) {
            console.warn('Failed to load Amazon data:', error.message);
            return { categories: {} };
        }
    }

    static countAmazonBooks(amazonData) {
        if (!amazonData.categories) return 0;
        return Object.values(amazonData.categories).flat().length;
    }

    static getBookImageUrl(book, source) {
        if (source === 'local' && book.cover) {
            return book.cover;
        } else if (source === 'amazon' && book.imageUrl) {
            return book.imageUrl;
        }
        return '/images/book-placeholder.jpg';
    }

    static getBookProductUrl(book, source) {
        if (source === 'local' && book.affiliate_link) {
            return book.affiliate_link;
        } else if (source === 'local') {
            return `/books.html#${book.id}`;
        } else if (source === 'amazon' && book.productUrl) {
            return book.productUrl;
        }
        return '#';
    }

    static getBookCategory(book, source) {
        if (source === 'local' && book.genre) {
            return book.genre.toLowerCase().replace(' ', '_');
        } else if (source === 'amazon' && book.category) {
            return book.category;
        }
        return 'general';
    }

    static getDefaultUserPreferences() {
        // Not used in this version, but kept for compatibility
        return {
            genres: [],
            authors: [],
            readingLevel: 'intermediate'
        };
    }

    static removeDuplicates(recommendations) {
        const seen = new Set();
        return recommendations.filter(book => {
            const identifier = book.title.toLowerCase().trim();
            if (seen.has(identifier)) {
                return false;
            }
            seen.add(identifier);
            return true;
        });
    }

    static async getFallbackRecommendations() {
        console.log('Using fallback recommendations');
        try {
            const localBooks = await this.loadLocalBooks();
            return this.getPopularBooks(localBooks, 'local').slice(0, 8);
        } catch (error) {
            // Ultimate fallback - hardcoded sample
            return [
                {
                    id: 'fallback-1',
                    title: 'As A Man Thinketh',
                    author: 'James Allen',
                    price: 'Free',
                    rating: '4.5',
                    imageUrl: '/images/as-a-man-thinketh-1ce433f8.png',
                    productUrl: '/books.html#As-A-Man-Thinketh',
                    category: 'self_help',
                    source: 'local',
                    featured: true
                },
                {
                    id: 'fallback-2',
                    title: 'Wild Dark Shore',
                    author: 'Charlotte McConaghy',
                    price: '$24.99',
                    rating: '4.3',
                    imageUrl: '/images/wild-dark-shore-e96e47d9.jpg',
                    productUrl: '/books.html#Wild-Dark-Shore',
                    category: 'drama',
                    source: 'local',
                    featured: true
                }
            ];
        }
    }

    // Helper method to get books by category
    static async getBooksByCategory(category) {
        try {
            const [localBooks, amazonData] = await Promise.all([
                this.loadLocalBooks(),
                this.loadAmazonData()
            ]);
            
            const localCategoryBooks = localBooks.filter(book => 
                this.getBookCategory(book, 'local') === category
            );
            
            const amazonCategoryBooks = amazonData.categories && amazonData.categories[category] 
                ? amazonData.categories[category] 
                : [];
            
            return [...localCategoryBooks, ...amazonCategoryBooks]
                .map(book => ({
                    ...book,
                    source: book.source || (amazonCategoryBooks.includes(book) ? 'amazon' : 'local'),
                    imageUrl: this.getBookImageUrl(book, book.source || 'local'),
                    productUrl: this.getBookProductUrl(book, book.source || 'local')
                }));
                
        } catch (error) {
            console.error('Error getting books by category:', error);
            return [];
        }
    }

    // Helper method to get all available categories
    static async getAvailableCategories() {
        try {
            const [localBooks, amazonData] = await Promise.all([
                this.loadLocalBooks(),
                this.loadAmazonData()
            ]);
            
            const categories = new Set();
            
            // Add categories from local books
            localBooks.forEach(book => {
                if (book.genre) {
                    categories.add(book.genre.toLowerCase().replace(' ', '_'));
                }
            });
            
            // Add categories from Amazon data
            if (amazonData.categories) {
                Object.keys(amazonData.categories).forEach(category => {
                    categories.add(category);
                });
            }
            
            return Array.from(categories);
            
        } catch (error) {
            console.error('Error getting categories:', error);
            return ['self_help', 'drama', 'programming', 'fiction'];
        }
    }
}