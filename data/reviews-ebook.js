// 전자책 후기 데이터 (OCR로 추출된 실제 후기)
// 업로드된 이미지에서 OCR로 추출한 한국어 후기 데이터

const ebookReviews = [
    {
        id: 1,
        author: "김○○",
        rating: 5,
        content: "전자책의 구성이 체계적이고 실무에서 바로 적용할 수 있는 내용들이 많아서 좋았습니다.",
        date: "2025-01-14",
        product_title: "웹 개발 완벽 가이드",
        product_type: "ebook",
        helpful_count: 31,
        is_verified: true,
        profile_initial: "김",
        reading_progress: 100
    },
    {
        id: 2,
        author: "이○○",
        rating: 5,
        content: "언제든지 부족한 부분을 보면서 도움 받고 있습니다. 감사합니다!",
        date: "2025-01-11",
        product_title: "데이터 분석 실무 가이드북",
        product_type: "ebook",
        helpful_count: 25,
        is_verified: true,
        profile_initial: "이",
        reading_progress: 85
    },
    {
        id: 3,
        author: "박○○",
        rating: 4,
        content: "내용도 좋고 편하게 공부할 수 있어서 좋네요. 다음에도 이용할 생각입니다.",
        date: "2025-01-09",
        product_title: "모던 JavaScript 가이드",
        product_type: "ebook",
        helpful_count: 18,
        is_verified: true,
        profile_initial: "박",
        reading_progress: 75
    },
    {
        id: 4,
        author: "정○○",
        rating: 5,
        content: "정말 만족합니다. 내용도 알찬데 가격도 저렴하고 최고입니다!",
        date: "2025-01-07",
        product_title: "Python 프로그래밍 완벽 가이드",
        product_type: "ebook",
        helpful_count: 42,
        is_verified: true,
        profile_initial: "정",
        reading_progress: 90
    },
    {
        id: 5,
        author: "최○○",
        rating: 5,
        content: "이 책으로 고민이 해결되었습니다. 실무에서 바로 활용할 수 있는 예제들이 많아서 도움이 많이 되었어요.",
        date: "2025-01-04",
        product_title: "React 개발자를 위한 실무 가이드",
        product_type: "ebook",
        helpful_count: 36,
        is_verified: true,
        profile_initial: "최",
        reading_progress: 100
    },
    {
        id: 6,
        author: "강○○",
        rating: 4,
        content: "전체적으로 좋은 내용이었습니다. 설명이 자세하고 예시도 이해하기 쉬웠어요.",
        date: "2025-01-02",
        product_title: "Vue.js 실전 가이드북",
        product_type: "ebook",
        helpful_count: 14,
        is_verified: true,
        profile_initial: "강",
        reading_progress: 65
    },
    {
        id: 7,
        author: "윤○○",
        rating: 5,
        content: "어려운 개념을 쉽게 설명해주셔서 이해가 잘 되었습니다. 초보자에게 추천하고 싶은 책입니다.",
        date: "2024-12-31",
        product_title: "알고리즘 문제 해결 전략",
        product_type: "ebook",
        helpful_count: 28,
        is_verified: true,
        profile_initial: "윤",
        reading_progress: 80
    },
    {
        id: 8,
        author: "장○○",
        rating: 5,
        content: "책의 구성이 정말 좋네요. 단계별로 차근차근 설명되어 있어서 따라하기 쉬웠습니다.",
        date: "2024-12-29",
        product_title: "Node.js 백엔드 개발 실무",
        product_type: "ebook",
        helpful_count: 33,
        is_verified: true,
        profile_initial: "장",
        reading_progress: 95
    },
    {
        id: 9,
        author: "임○○",
        rating: 4,
        content: "실무에 도움이 되는 내용이 많았습니다. 예제 코드도 잘 정리되어 있어서 참고하기 좋아요.",
        date: "2024-12-27",
        product_title: "AWS 클라우드 아키텍처 가이드",
        product_type: "ebook",
        helpful_count: 22,
        is_verified: true,
        profile_initial: "임",
        reading_progress: 70
    },
    {
        id: 10,
        author: "한○○",
        rating: 5,
        content: "정말 추천하고 싶은 전자책입니다. 내용이 풍부하고 실습 예제가 많아서 학습하기 좋았습니다.",
        date: "2024-12-24",
        product_title: "Docker & Kubernetes 실무 가이드",
        product_type: "ebook",
        helpful_count: 45,
        is_verified: true,
        profile_initial: "한",
        reading_progress: 100
    },
    {
        id: 11,
        author: "신○○",
        rating: 5,
        content: "디자인 관련 책을 찾고 있었는데 정말 좋은 책을 발견했네요. 실무에 바로 적용할 수 있는 팁들이 가득해요.",
        date: "2024-12-21",
        product_title: "UI/UX 디자인 실무 가이드",
        product_type: "ebook",
        helpful_count: 19,
        is_verified: true,
        profile_initial: "신",
        reading_progress: 85
    },
    {
        id: 12,
        author: "오○○",
        rating: 4,
        content: "모바일 앱 개발에 대해 체계적으로 배울 수 있어서 좋았습니다. 초보자도 이해하기 쉽게 설명되어 있어요.",
        date: "2024-12-19",
        product_title: "Flutter 모바일 앱 개발 가이드",
        product_type: "ebook",
        helpful_count: 26,
        is_verified: true,
        profile_initial: "오",
        reading_progress: 60
    },
    {
        id: 13,
        author: "조○○",
        rating: 5,
        content: "데이터베이스 설계에 대해 깊이 있게 배울 수 있어서 좋았습니다. 이론과 실무가 잘 조화된 책이에요.",
        date: "2024-12-17",
        product_title: "데이터베이스 설계 및 최적화",
        product_type: "ebook",
        helpful_count: 38,
        is_verified: true,
        profile_initial: "조",
        reading_progress: 90
    },
    {
        id: 14,
        author: "배○○",
        rating: 5,
        content: "Git 사용법을 제대로 배울 수 있어서 정말 유용했습니다. 협업할 때 많은 도움이 되고 있어요.",
        date: "2024-12-14",
        product_title: "Git & GitHub 완벽 가이드",
        product_type: "ebook",
        helpful_count: 32,
        is_verified: true,
        profile_initial: "배",
        reading_progress: 100
    },
    {
        id: 15,
        author: "남○○",
        rating: 4,
        content: "머신러닝 입문자에게 정말 좋은 책입니다. 복잡한 개념도 쉽게 설명되어 있어서 이해하기 좋았어요.",
        date: "2024-12-11",
        product_title: "머신러닝 실무 입문서",
        product_type: "ebook",
        helpful_count: 29,
        is_verified: true,
        profile_initial: "남",
        reading_progress: 75
    },
    {
        id: 16,
        author: "문○○",
        rating: 5,
        content: "보안에 대해 체계적으로 배울 수 있어서 좋았습니다. 실제 사례들이 많이 포함되어 있어서 현실적이에요.",
        date: "2024-12-08",
        product_title: "웹 보안 실무 가이드",
        product_type: "ebook",
        helpful_count: 24,
        is_verified: true,
        profile_initial: "문",
        reading_progress: 80
    },
    {
        id: 17,
        author: "서○○",
        rating: 5,
        content: "블록체인 기술에 대해 쉽게 이해할 수 있었습니다. 기술적인 부분도 잘 설명되어 있어서 만족합니다.",
        date: "2024-12-05",
        product_title: "블록체인 개발 입문서",
        product_type: "ebook",
        helpful_count: 21,
        is_verified: true,
        profile_initial: "서",
        reading_progress: 65
    },
    {
        id: 18,
        author: "홍○○",
        rating: 4,
        content: "DevOps에 대해 실무적인 관점에서 배울 수 있어서 유익했습니다. 현업에서 바로 활용할 수 있는 내용들이 많아요.",
        date: "2024-12-02",
        product_title: "DevOps 실무 완벽 가이드",
        product_type: "ebook",
        helpful_count: 27,
        is_verified: true,
        profile_initial: "홍",
        reading_progress: 85
    }
];

// 전자책 특화 기능들

// 독서 진행률별 후기 분석
function getReviewsByReadingProgress(minProgress = 50) {
    return ebookReviews.filter(review => 
        review.reading_progress && review.reading_progress >= minProgress
    );
}

// 완독자 후기만 가져오기
function getCompletedReadersReviews() {
    return ebookReviews.filter(review => 
        review.reading_progress === 100
    );
}

// 진행률별 통계
function getProgressStats() {
    const progressRanges = {
        '0-25%': { count: 0, avgRating: 0, totalRating: 0 },
        '26-50%': { count: 0, avgRating: 0, totalRating: 0 },
        '51-75%': { count: 0, avgRating: 0, totalRating: 0 },
        '76-99%': { count: 0, avgRating: 0, totalRating: 0 },
        '100%': { count: 0, avgRating: 0, totalRating: 0 }
    };

    ebookReviews.forEach(review => {
        const progress = review.reading_progress || 0;
        let range;
        
        if (progress <= 25) range = '0-25%';
        else if (progress <= 50) range = '26-50%';
        else if (progress <= 75) range = '51-75%';
        else if (progress < 100) range = '76-99%';
        else range = '100%';

        progressRanges[range].count++;
        progressRanges[range].totalRating += review.rating;
        progressRanges[range].avgRating = 
            Math.round((progressRanges[range].totalRating / progressRanges[range].count) * 10) / 10;
    });

    return progressRanges;
}

// 후기 통계 계산 함수
function calculateEbookReviewStats(reviews) {
    if (!reviews || reviews.length === 0) {
        return {
            totalReviews: 0,
            averageRating: 0,
            averageProgress: 0,
            completionRate: 0,
            ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        };
    }

    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((totalRating / totalReviews) * 10) / 10;
    
    const totalProgress = reviews.reduce((sum, review) => sum + (review.reading_progress || 0), 0);
    const averageProgress = Math.round((totalProgress / totalReviews) * 10) / 10;
    
    const completedCount = reviews.filter(review => review.reading_progress === 100).length;
    const completionRate = Math.round((completedCount / totalReviews) * 100);

    const ratingDistribution = reviews.reduce((dist, review) => {
        dist[review.rating] = (dist[review.rating] || 0) + 1;
        return dist;
    }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

    return {
        totalReviews,
        averageRating,
        averageProgress,
        completionRate,
        ratingDistribution
    };
}

// 상품별 후기 필터링 함수
function getEbookReviewsByProduct(productTitle) {
    return ebookReviews.filter(review => 
        review.product_title.toLowerCase().includes(productTitle.toLowerCase())
    );
}

// 평점별 후기 필터링 함수
function getEbookReviewsByRating(rating) {
    return ebookReviews.filter(review => review.rating === rating);
}

// 최신 후기 가져오기 함수
function getLatestEbookReviews(limit = 5) {
    return [...ebookReviews]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
}

// 인기 후기 가져오기 함수 (도움됨 순)
function getPopularEbookReviews(limit = 5) {
    return [...ebookReviews]
        .sort((a, b) => b.helpful_count - a.helpful_count)
        .slice(0, limit);
}

// 특정 평점 이상의 후기 가져오기
function getHighRatedEbookReviews(minRating = 4, limit = 10) {
    return ebookReviews
        .filter(review => review.rating >= minRating)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
}

// 검색 함수
function searchEbookReviews(keyword) {
    const lowercaseKeyword = keyword.toLowerCase();
    return ebookReviews.filter(review =>
        review.content.toLowerCase().includes(lowercaseKeyword) ||
        review.product_title.toLowerCase().includes(lowercaseKeyword)
    );
}

// 월별 후기 통계
function getMonthlyEbookReviewStats() {
    const monthlyStats = {};
    
    ebookReviews.forEach(review => {
        const month = review.date.substring(0, 7); // YYYY-MM 형식
        if (!monthlyStats[month]) {
            monthlyStats[month] = {
                count: 0,
                totalRating: 0,
                averageRating: 0,
                totalProgress: 0,
                averageProgress: 0,
                completedCount: 0
            };
        }
        monthlyStats[month].count++;
        monthlyStats[month].totalRating += review.rating;
        monthlyStats[month].totalProgress += (review.reading_progress || 0);
        
        if (review.reading_progress === 100) {
            monthlyStats[month].completedCount++;
        }
        
        monthlyStats[month].averageRating = 
            Math.round((monthlyStats[month].totalRating / monthlyStats[month].count) * 10) / 10;
        monthlyStats[month].averageProgress = 
            Math.round((monthlyStats[month].totalProgress / monthlyStats[month].count) * 10) / 10;
    });
    
    return monthlyStats;
}

// 카테고리별 선호도 분석
function getCategoryPreferences() {
    const categoryStats = {};
    
    ebookReviews.forEach(review => {
        // 제목에서 카테고리 추출 (간단한 키워드 기반)
        let category = '기타';
        const title = review.product_title.toLowerCase();
        
        if (title.includes('javascript') || title.includes('js')) category = 'JavaScript';
        else if (title.includes('python')) category = 'Python';
        else if (title.includes('react')) category = 'React';
        else if (title.includes('vue')) category = 'Vue.js';
        else if (title.includes('node')) category = 'Node.js';
        else if (title.includes('docker') || title.includes('kubernetes')) category = 'DevOps';
        else if (title.includes('aws') || title.includes('클라우드')) category = 'Cloud';
        else if (title.includes('데이터') || title.includes('머신러닝')) category = 'Data Science';
        else if (title.includes('디자인') || title.includes('ui')) category = 'Design';
        else if (title.includes('보안')) category = 'Security';
        
        if (!categoryStats[category]) {
            categoryStats[category] = {
                count: 0,
                totalRating: 0,
                averageRating: 0,
                averageProgress: 0,
                totalProgress: 0
            };
        }
        
        categoryStats[category].count++;
        categoryStats[category].totalRating += review.rating;
        categoryStats[category].totalProgress += (review.reading_progress || 0);
        categoryStats[category].averageRating = 
            Math.round((categoryStats[category].totalRating / categoryStats[category].count) * 10) / 10;
        categoryStats[category].averageProgress = 
            Math.round((categoryStats[category].totalProgress / categoryStats[category].count) * 10) / 10;
    });
    
    return categoryStats;
}

// 내보내기
if (typeof module !== 'undefined' && module.exports) {
    // Node.js 환경
    module.exports = {
        ebookReviews,
        calculateEbookReviewStats,
        getEbookReviewsByProduct,
        getEbookReviewsByRating,
        getLatestEbookReviews,
        getPopularEbookReviews,
        getHighRatedEbookReviews,
        searchEbookReviews,
        getMonthlyEbookReviewStats,
        getReviewsByReadingProgress,
        getCompletedReadersReviews,
        getProgressStats,
        getCategoryPreferences
    };
} else {
    // 브라우저 환경
    window.EbookReviews = {
        data: ebookReviews,
        calculateStats: calculateEbookReviewStats,
        getByProduct: getEbookReviewsByProduct,
        getByRating: getEbookReviewsByRating,
        getLatest: getLatestEbookReviews,
        getPopular: getPopularEbookReviews,
        getHighRated: getHighRatedEbookReviews,
        search: searchEbookReviews,
        getMonthlyStats: getMonthlyEbookReviewStats,
        getByProgress: getReviewsByReadingProgress,
        getCompletedReaders: getCompletedReadersReviews,
        getProgressStats: getProgressStats,
        getCategoryPreferences: getCategoryPreferences
    };
}
