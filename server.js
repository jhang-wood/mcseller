const express = require('express');
const path = require('path');
const app = express();
const PORT = 5000;

// JSON 파싱 미들웨어
app.use(express.json());

// 캐시 방지 미들웨어
app.use((req, res, next) => {
    // HTML 파일과 관련 리소스들의 캐시를 방지
    if (req.url.endsWith('.html') || req.url === '/') {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});

// 정적 파일 서빙
app.use(express.static('.', {
    etag: false,
    lastModified: false,
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.set('Pragma', 'no-cache');
            res.set('Expires', '0');
        }
    }
}));

// 환경 변수 전달을 위한 엔드포인트
app.get('/api/env', (req, res) => {
    res.json({
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
    });
});

// 루트 경로
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
});