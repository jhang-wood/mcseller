// 상품 데이터 (강의 및 전자책)
// 실제 운영 시에는 Supabase 데이터베이스에서 가져올 데이터

const products = {
    lectures: [
        {
            id: 'lecture-1',
            title: 'JavaScript 마스터클래스',
            description: '기초부터 고급까지 JavaScript의 모든 것을 배우는 완벽한 강의입니다. ES6+ 문법, 비동기 프로그래밍, DOM 조작, 이벤트 처리 등 실무에서 필요한 모든 내용을 다룹니다.',
            price: 89000,
            originalPrice: 120000,
            type: 'lecture',
            image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=500&h=300&fit=crop',
            instructor: '김개발',
            rating: 4.8,
            totalStudents: 1234,
            duration: '12시간 30분',
            level: '중급',
            tags: ['JavaScript', 'ES6', '프론트엔드', 'DOM'],
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            curriculum: [
                '1. JavaScript 기초 문법',
                '2. 변수와 데이터 타입',
                '3. 함수와 스코프',
                '4. 객체와 배열',
                '5. ES6+ 문법',
                '6. 비동기 프로그래밍',
                '7. DOM 조작',
                '8. 이벤트 처리',
                '9. 에러 처리',
                '10. 실전 프로젝트'
            ],
            features: [
                '평생 무제한 시청',
                '모바일/태블릿 지원',
                '한국어 자막 제공',
                '수료증 발급',
                '1:1 질문 답변'
            ]
        },
        {
            id: 'lecture-2',
            title: 'React 입문부터 실전까지',
            description: 'React를 처음 시작하는 분들을 위한 완벽한 입문 강의입니다. 컴포넌트 기반 개발, Hook, 상태 관리, 라우팅까지 실무에 필요한 모든 것을 학습합니다.',
            price: 79000,
            originalPrice: 110000,
            type: 'lecture',
            image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500&h=300&fit=crop',
            instructor: '이리액트',
            rating: 4.9,
            totalStudents: 987,
            duration: '10시간 15분',
            level: '초급',
            tags: ['React', 'JSX', '컴포넌트', 'Hook'],
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            curriculum: [
                '1. React 개발 환경 설정',
                '2. JSX 문법과 컴포넌트',
                '3. Props와 State',
                '4. 이벤트 처리',
                '5. Hook 완전 정복',
                '6. 상태 관리',
                '7. React Router',
                '8. API 연동',
                '9. 최적화 기법',
                '10. 배포 및 운영'
            ],
            features: [
                '최신 React 18 기준',
                '실습 중심 강의',
                '완성 프로젝트 5개',
                '코드 리뷰 제공',
                '취업 지원'
            ]
        },
        {
            id: 'lecture-3',
            title: 'Python 데이터 분석',
            description: 'Python을 활용한 데이터 분석의 기초부터 실무까지 배워보세요. Pandas, NumPy, Matplotlib를 활용한 데이터 처리와 시각화를 마스터합니다.',
            price: 95000,
            originalPrice: 130000,
            type: 'lecture',
            image: 'https://images.unsplash.com/photo-1518186233392-c232efbf2373?w=500&h=300&fit=crop',
            instructor: '박데이터',
            rating: 4.7,
            totalStudents: 756,
            duration: '14시간 20분',
            level: '중급',
            tags: ['Python', 'Pandas', 'NumPy', '데이터분석'],
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            curriculum: [
                '1. Python 기초 복습',
                '2. Pandas 라이브러리',
                '3. NumPy 배열 처리',
                '4. 데이터 전처리',
                '5. 탐색적 데이터 분석',
                '6. 데이터 시각화',
                '7. 통계 분석',
                '8. 머신러닝 입문',
                '9. 실전 프로젝트',
                '10. 포트폴리오 작성'
            ],
            features: [
                '실제 데이터셋 활용',
                'Jupyter Notebook 제공',
                '통계학 기초 포함',
                '포트폴리오 완성',
                '취업 연계 프로그램'
            ]
        }
    ],
    
    ebooks: [
        {
            id: 'ebook-1',
            title: '웹 개발 완벽 가이드',
            description: '현대 웹 개발의 모든 것을 담은 완벽한 가이드북입니다. HTML, CSS, JavaScript부터 최신 프레임워크까지 체계적으로 학습할 수 있습니다.',
            price: 29000,
            originalPrice: 45000,
            type: 'ebook',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=300&fit=crop',
            author: '최웹마스터',
            rating: 4.6,
            totalReaders: 543,
            pages: 420,
            level: '초급',
            tags: ['HTML', 'CSS', 'JavaScript', '웹개발'],
            contentUrl: '/content/ebook-web-guide.html',
            tableOfContents: [
                '1장. 웹 개발 기초',
                '2장. HTML 완전 정복',
                '3장. CSS 스타일링',
                '4장. JavaScript 기초',
                '5장. 반응형 웹 디자인',
                '6장. 프론트엔드 프레임워크',
                '7장. 백엔드 기초',
                '8장. 데이터베이스 연동',
                '9장. 배포와 운영',
                '10장. 실전 프로젝트'
            ],
            features: [
                '500페이지 분량',
                '실습 예제 100+',
                'PDF 다운로드',
                '모바일 최적화',
                '무료 업데이트'
            ]
        },
        {
            id: 'ebook-2',
            title: 'Node.js 백엔드 개발 실무서',
            description: 'Node.js로 실제 서비스를 만들어보는 실무 중심의 전자책입니다. Express, MongoDB, JWT를 활용한 완전한 백엔드 시스템 구축을 학습합니다.',
            price: 35000,
            originalPrice: 50000,
            type: 'ebook',
            image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&h=300&fit=crop',
            author: '정백엔드',
            rating: 4.8,
            totalReaders: 432,
            pages: 380,
            level: '고급',
            tags: ['Node.js', 'Express', 'MongoDB', 'API'],
            contentUrl: '/content/ebook-nodejs.html',
            tableOfContents: [
                '1장. Node.js 환경 설정',
                '2장. Express 서버 구축',
                '3장. 라우팅과 미들웨어',
                '4장. MongoDB 연동',
                '5장. 사용자 인증 시스템',
                '6장. JWT 토큰 관리',
                '7장. API 설계와 개발',
                '8장. 에러 처리',
                '9장. 테스트 코드 작성',
                '10장. 배포와 모니터링'
            ],
            features: [
                '실무 프로젝트 기반',
                '완성 코드 제공',
                '보안 가이드 포함',
                '성능 최적화 팁',
                '운영 경험 공유'
            ]
        },
        {
            id: 'ebook-3',
            title: 'React 심화 가이드북',
            description: 'React의 고급 개념과 최적화 기법을 다루는 심화 학습서입니다. 성능 최적화, 상태 관리, 테스팅까지 프로급 React 개발자가 되기 위한 모든 것을 담았습니다.',
            price: 32000,
            originalPrice: 48000,
            type: 'ebook',
            image: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=500&h=300&fit=crop',
            author: '김리액트',
            rating: 4.9,
            totalReaders: 321,
            pages: 350,
            level: '고급',
            tags: ['React', 'Hook', '최적화', '상태관리'],
            contentUrl: '/content/ebook-react-advanced.html',
            tableOfContents: [
                '1장. React 고급 패턴',
                '2장. Hook 심화 활용',
                '3장. 성능 최적화',
                '4장. 상태 관리 라이브러리',
                '5장. 컴포넌트 설계',
                '6장. 테스트 전략',
                '7장. 타입스크립트 연동',
                '8장. 서버 사이드 렌더링',
                '9장. 배포 최적화',
                '10장. 실전 아키텍처'
            ],
            features: [
                '고급 패턴 완전 정복',
                '성능 최적화 비법',
                '실무 경험 기반',
                '최신 버전 반영',
                '코드 품질 가이드'
            ]
        }
    ]
};

// 상품 검색 및 필터링 함수들
const ProductService = {
    // 모든 상품 가져오기
    getAll() {
        return [...products.lectures, ...products.ebooks];
    },
    
    // 타입별 상품 가져오기
    getByType(type) {
        return products[type] || [];
    },
    
    // ID로 상품 찾기
    getById(id) {
        const allProducts = this.getAll();
        return allProducts.find(product => product.id === id);
    },
    
    // 검색 기능
    search(keyword) {
        const allProducts = this.getAll();
        const lowercaseKeyword = keyword.toLowerCase();
        
        return allProducts.filter(product =>
            product.title.toLowerCase().includes(lowercaseKeyword) ||
            product.description.toLowerCase().includes(lowercaseKeyword) ||
            product.tags.some(tag => tag.toLowerCase().includes(lowercaseKeyword))
        );
    },
    
    // 가격 범위로 필터링
    getByPriceRange(minPrice, maxPrice) {
        const allProducts = this.getAll();
        return allProducts.filter(product => 
            product.price >= minPrice && product.price <= maxPrice
        );
    },
    
    // 평점 기준으로 정렬
    getByRating(minRating = 4.0) {
        const allProducts = this.getAll();
        return allProducts
            .filter(product => product.rating >= minRating)
            .sort((a, b) => b.rating - a.rating);
    },
    
    // 인기 상품 (학생 수 기준)
    getPopular(limit = 6) {
        const allProducts = this.getAll();
        return allProducts
            .sort((a, b) => (b.totalStudents || b.totalReaders || 0) - (a.totalStudents || a.totalReaders || 0))
            .slice(0, limit);
    },
    
    // 최신 상품
    getLatest(limit = 6) {
        // 실제로는 created_at 필드를 기준으로 정렬
        return this.getAll().slice(0, limit);
    },
    
    // 추천 상품 (평점과 인기도 조합)
    getRecommended(limit = 3) {
        const allProducts = this.getAll();
        return allProducts
            .filter(product => product.rating >= 4.5)
            .sort((a, b) => {
                const scoreA = product.rating * (product.totalStudents || product.totalReaders || 0);
                const scoreB = product.rating * (product.totalStudents || product.totalReaders || 0);
                return scoreB - scoreA;
            })
            .slice(0, limit);
    }
};

// 브라우저 환경에서 전역 접근 가능하도록 설정
if (typeof window !== 'undefined') {
    window.ProductService = ProductService;
    window.ProductData = products;
}

// Node.js 환경에서 모듈로 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        products,
        ProductService
    };
}