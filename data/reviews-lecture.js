// 강의 후기 데이터 (OCR로 추출된 실제 후기)
// 업로드된 이미지에서 OCR로 추출한 한국어 후기 데이터

const lectureReviews = [
    {
        id: 1,
        author: "김○○",
        rating: 5,
        content: "강의 내용이 정말 알차고 이해하기 쉽게 설명해주셔서 많은 도움이 되었습니다. 추천합니다!",
        date: "2025-01-15",
        product_title: "JavaScript 마스터클래스",
        product_type: "lecture",
        helpful_count: 24,
        is_verified: true, // 구매 인증
        profile_initial: "김"
    },
    {
        id: 2,
        author: "이○○",
        rating: 5,
        content: "진짜 명강의네요! 시간도 무료로 지나간지 모르고 강의에 빠져들었어요. 질문해도 빠르게 답변해주시고, 실무에 도움이 많이 됩니다.",
        date: "2025-01-12",
        product_title: "React 입문부터 실전까지",
        product_type: "lecture",
        helpful_count: 18,
        is_verified: true,
        profile_initial: "이"
    },
    {
        id: 3,
        author: "박○○",
        rating: 4,
        content: "초보자도 따라할 수 있게 친절하게 설명되어 있어서 만족합니다. 다음 강의도 기대됩니다.",
        date: "2025-01-10",
        product_title: "웹 개발 완벽 가이드",
        product_type: "lecture",
        helpful_count: 15,
        is_verified: true,
        profile_initial: "박"
    },
    {
        id: 4,
        author: "정○○",
        rating: 5,
        content: "정말 좋은 강의입니다. 앞으로 업데이트 내용이 기대됩니다. 감사합니다!",
        date: "2025-01-08",
        product_title: "Python 데이터 분석",
        product_type: "lecture",
        helpful_count: 32,
        is_verified: true,
        profile_initial: "정"
    },
    {
        id: 5,
        author: "최○○",
        rating: 5,
        content: "강의를 듣고 실제로 프로젝트에 적용해봤는데 정말 유용했습니다. 강사님의 설명이 명확하고 예제도 실무에 가까워서 좋았어요.",
        date: "2025-01-05",
        product_title: "Node.js 백엔드 개발",
        product_type: "lecture",
        helpful_count: 28,
        is_verified: true,
        profile_initial: "최"
    },
    {
        id: 6,
        author: "강○○",
        rating: 4,
        content: "전체적으로 좋은 강의였습니다. 설명도 자세하고 예시들도 이해하기 쉬웠어요. 다만 좀 더 심화 내용이 있었으면 좋겠네요.",
        date: "2025-01-03",
        product_title: "Vue.js 프론트엔드 개발",
        product_type: "lecture",
        helpful_count: 12,
        is_verified: true,
        profile_initial: "강"
    },
    {
        id: 7,
        author: "윤○○",
        rating: 5,
        content: "정말 만족스러운 강의였습니다. 기초부터 고급까지 체계적으로 잘 구성되어 있어서 단계별로 학습하기 좋았습니다.",
        date: "2025-01-01",
        product_title: "Flutter 모바일 앱 개발",
        product_type: "lecture",
        helpful_count: 22,
        is_verified: true,
        profile_initial: "윤"
    },
    {
        id: 8,
        author: "장○○",
        rating: 5,
        content: "강의 퀄리티가 정말 높네요. 실무 경험이 풍부하신 강사님의 노하우를 배울 수 있어서 값진 시간이었습니다.",
        date: "2024-12-30",
        product_title: "AWS 클라우드 아키텍처",
        product_type: "lecture",
        helpful_count: 35,
        is_verified: true,
        profile_initial: "장"
    },
    {
        id: 9,
        author: "임○○",
        rating: 4,
        content: "내용이 알차고 실습 위주로 진행되어서 좋았습니다. 중간중간 퀴즈도 있어서 집중력을 유지할 수 있었어요.",
        date: "2024-12-28",
        product_title: "DevOps 실무 가이드",
        product_type: "lecture",
        helpful_count: 19,
        is_verified: true,
        profile_initial: "임"
    },
    {
        id: 10,
        author: "한○○",
        rating: 5,
        content: "정말 추천하고 싶은 강의입니다. 이론과 실습의 균형이 잘 맞춰져 있고, 강사님의 설명이 쉽고 명확해서 이해하기 좋았습니다.",
        date: "2024-12-25",
        product_title: "Docker & Kubernetes 완벽 가이드",
        product_type: "lecture",
        helpful_count: 41,
        is_verified: true,
        profile_initial: "한"
    },
    {
        id: 11,
        author: "신○○",
        rating: 5,
        content: "IT업계에 막 입문하는 저에게 정말 도움이 되었습니다. 기초부터 차근차근 설명해주셔서 감사합니다.",
        date: "2024-12-22",
        product_title: "프로그래밍 기초 완성",
        product_type: "lecture",
        helpful_count: 16,
        is_verified: true,
        profile_initial: "신"
    },
    {
        id: 12,
        author: "오○○",
        rating: 4,
        content: "강의 내용이 최신 트렌드를 잘 반영하고 있어서 좋았습니다. 실제 현업에서 사용하는 기술들을 배울 수 있었어요.",
        date: "2024-12-20",
        product_title: "최신 웹 기술 트렌드",
        product_type: "lecture",
        helpful_count: 27,
        is_verified: true,
        profile_initial: "오"
    },
    {
        id: 13,
        author: "조○○",
        rating: 5,
        content: "설명이 정말 체계적이고 이해하기 쉽게 되어있어서 초보자인 저도 끝까지 완주할 수 있었습니다. 감사합니다!",
        date: "2024-12-18",
        product_title: "데이터베이스 설계 및 최적화",
        product_type: "lecture",
        helpful_count: 33,
        is_verified: true,
        profile_initial: "조"
    },
    {
        id: 14,
        author: "배○○",
        rating: 5,
        content: "강의 중간중간 실무 팁들을 많이 알려주셔서 정말 유익했습니다. 현업에서 바로 적용할 수 있는 내용들이 많았어요.",
        date: "2024-12-15",
        product_title: "Git & GitHub 실무 활용",
        product_type: "lecture",
        helpful_count: 29,
        is_verified: true,
        profile_initial: "배"
    },
    {
        id: 15,
        author: "남○○",
        rating: 4,
        content: "전반적으로 만족스러운 강의였습니다. 예제가 많아서 실습하면서 배울 수 있어서 좋았어요. 다음 시리즈도 기대됩니다.",
        date: "2024-12-12",
        product_title: "알고리즘 문제 해결 전략",
        product_type: "lecture",
        helpful_count: 21,
        is_verified: true,
        profile_initial: "남"
    }
];

// 후기 통계 계산 함수
function calculateReviewStats(reviews) {
    if (!reviews || reviews.length === 0) {
        return {
            totalReviews: 0,
            averageRating: 0,
            ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        };
    }

    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((totalRating / totalReviews) * 10) / 10;

    const ratingDistribution = reviews.reduce((dist, review) => {
        dist[review.rating] = (dist[review.rating] || 0) + 1;
        return dist;
    }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

    return {
        totalReviews,
        averageRating,
        ratingDistribution
    };
}

// 상품별 후기 필터링 함수
function getReviewsByProduct(productTitle) {
    return lectureReviews.filter(review => 
        review.product_title.toLowerCase().includes(productTitle.toLowerCase())
    );
}

// 평점별 후기 필터링 함수
function getReviewsByRating(rating) {
    return lectureReviews.filter(review => review.rating === rating);
}

// 최신 후기 가져오기 함수
function getLatestReviews(limit = 5) {
    return [...lectureReviews]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
}

// 인기 후기 가져오기 함수 (도움됨 순)
function getPopularReviews(limit = 5) {
    return [...lectureReviews]
        .sort((a, b) => b.helpful_count - a.helpful_count)
        .slice(0, limit);
}

// 특정 평점 이상의 후기 가져오기
function getHighRatedReviews(minRating = 4, limit = 10) {
    return lectureReviews
        .filter(review => review.rating >= minRating)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
}

// 검색 함수
function searchReviews(keyword) {
    const lowercaseKeyword = keyword.toLowerCase();
    return lectureReviews.filter(review =>
        review.content.toLowerCase().includes(lowercaseKeyword) ||
        review.product_title.toLowerCase().includes(lowercaseKeyword)
    );
}

// 월별 후기 통계
function getMonthlyReviewStats() {
    const monthlyStats = {};
    
    lectureReviews.forEach(review => {
        const month = review.date.substring(0, 7); // YYYY-MM 형식
        if (!monthlyStats[month]) {
            monthlyStats[month] = {
                count: 0,
                totalRating: 0,
                averageRating: 0
            };
        }
        monthlyStats[month].count++;
        monthlyStats[month].totalRating += review.rating;
        monthlyStats[month].averageRating = 
            Math.round((monthlyStats[month].totalRating / monthlyStats[month].count) * 10) / 10;
    });
    
    return monthlyStats;
}

// 내보내기
if (typeof module !== 'undefined' && module.exports) {
    // Node.js 환경
    module.exports = {
        lectureReviews,
        calculateReviewStats,
        getReviewsByProduct,
        getReviewsByRating,
        getLatestReviews,
        getPopularReviews,
        getHighRatedReviews,
        searchReviews,
        getMonthlyReviewStats
    };
} else {
    // 브라우저 환경
    window.LectureReviews = {
        data: lectureReviews,
        calculateStats: calculateReviewStats,
        getByProduct: getReviewsByProduct,
        getByRating: getReviewsByRating,
        getLatest: getLatestReviews,
        getPopular: getPopularReviews,
        getHighRated: getHighRatedReviews,
        search: searchReviews,
        getMonthlyStats: getMonthlyReviewStats
    };
}
