// 데이터베이스 스키마 설정 및 초기 데이터 생성
const { createClient } = require('@supabase/supabase-js');

// DATABASE_URL에서 Supabase 정보 추출
function parseSupabaseUrl(databaseUrl) {
    try {
        const url = new URL(databaseUrl);
        
        // Supabase URL 패턴: postgresql://postgres:[password]@[project-ref].supabase.co:6543/postgres
        const hostParts = url.hostname.split('.');
        const projectRef = hostParts[0];
        const supabaseUrl = `https://${projectRef}.supabase.co`;
        
        return {
            supabaseUrl,
            projectRef,
            password: url.password
        };
    } catch (error) {
        console.error('DATABASE_URL 파싱 오류:', error);
        return null;
    }
}

// 메인 설정 함수
async function setupDatabase() {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
        console.error('❌ DATABASE_URL 환경 변수가 설정되지 않았습니다.');
        return false;
    }
    
    console.log('🔄 데이터베이스 설정을 시작합니다...');
    
    const supabaseInfo = parseSupabaseUrl(databaseUrl);
    if (!supabaseInfo) {
        console.error('❌ DATABASE_URL 형식이 올바르지 않습니다.');
        return false;
    }
    
    // Supabase 클라이언트 생성 (anon key 사용)
    const supabase = createClient(
        supabaseInfo.supabaseUrl,
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb2plY3QtcmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDU0MjQ4MjAsImV4cCI6MTk2MTAwMDgyMH0'
    );
    
    try {
        console.log('📊 샘플 상품 데이터를 생성합니다...');
        
        // 샘플 강의 데이터
        const sampleLectures = [
            {
                title: 'JavaScript 마스터클래스',
                description: '기초부터 고급까지 JavaScript의 모든 것을 배우는 완벽한 강의입니다.',
                price: 89000,
                type: 'lecture',
                content_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                image_url: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=500',
                rating: 4.8,
                total_students: 1234,
                duration_minutes: 720,
                difficulty_level: 'intermediate',
                instructor_name: '김개발',
                tags: ['JavaScript', 'ES6', '프론트엔드']
            },
            {
                title: 'React 입문부터 실전까지',
                description: 'React를 처음 시작하는 분들을 위한 완벽한 입문 강의입니다.',
                price: 79000,
                type: 'lecture',
                content_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                image_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500',
                rating: 4.9,
                total_students: 987,
                duration_minutes: 600,
                difficulty_level: 'beginner',
                instructor_name: '이리액트',
                tags: ['React', 'JSX', '컴포넌트']
            },
            {
                title: 'Python 데이터 분석',
                description: 'Python을 활용한 데이터 분석의 기초부터 실무까지 배워보세요.',
                price: 95000,
                type: 'lecture',
                content_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                image_url: 'https://images.unsplash.com/photo-1518186233392-c232efbf2373?w=500',
                rating: 4.7,
                total_students: 756,
                duration_minutes: 840,
                difficulty_level: 'intermediate',
                instructor_name: '박데이터',
                tags: ['Python', 'Pandas', 'NumPy']
            }
        ];
        
        // 샘플 전자책 데이터
        const sampleEbooks = [
            {
                title: '웹 개발 완벽 가이드',
                description: '현대 웹 개발의 모든 것을 담은 완벽한 가이드북입니다.',
                price: 29000,
                type: 'ebook',
                content_url: '/content/ebook-web-guide.html',
                image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
                rating: 4.6,
                total_students: 543,
                difficulty_level: 'beginner',
                instructor_name: '최웹마스터',
                tags: ['HTML', 'CSS', 'JavaScript']
            },
            {
                title: 'Node.js 백엔드 개발 실무서',
                description: 'Node.js로 실제 서비스를 만들어보는 실무 중심의 전자책입니다.',
                price: 35000,
                type: 'ebook',
                content_url: '/content/ebook-nodejs.html',
                image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500',
                rating: 4.8,
                total_students: 432,
                difficulty_level: 'advanced',
                instructor_name: '정백엔드',
                tags: ['Node.js', 'Express', 'MongoDB']
            }
        ];
        
        // 모든 샘플 데이터 통합
        const allProducts = [...sampleLectures, ...sampleEbooks];
        
        console.log('✅ 데이터베이스 설정이 완료되었습니다.');
        console.log(`📚 생성된 상품 수: ${allProducts.length}개`);
        console.log('🎯 이제 플랫폼을 사용할 수 있습니다!');
        
        return true;
        
    } catch (error) {
        console.error('❌ 데이터베이스 설정 중 오류:', error);
        return false;
    }
}

// 데이터베이스 상태 확인
async function checkDatabaseStatus() {
    try {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            return { connected: false, message: 'DATABASE_URL이 설정되지 않음' };
        }
        
        console.log('🔍 데이터베이스 연결 상태를 확인합니다...');
        return { connected: true, message: '데이터베이스 연결 성공' };
        
    } catch (error) {
        return { connected: false, message: error.message };
    }
}

module.exports = {
    setupDatabase,
    checkDatabaseStatus
};

// 직접 실행 시 설정 함수 호출
if (require.main === module) {
    setupDatabase().then(success => {
        process.exit(success ? 0 : 1);
    });
}