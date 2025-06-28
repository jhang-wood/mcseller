// 전자책 리더 JavaScript
class EbookReader {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 1;
        this.fontSize = 16;
        this.lineHeight = 1.8;
        this.isDarkMode = false;
        this.bookmarks = [];
        this.readingProgress = 0;
        this.content = null;
        this.pages = [];
        this.tableOfContents = [];
        
        this.init();
    }
    
    // 리더 초기화
    init() {
        this.setupEventListeners();
        this.loadUserPreferences();
        this.initializeKeyboardShortcuts();
    }
    
    // 전자책 콘텐츠 로드
    async loadContent(contentUrl) {
        try {
            if (!contentUrl) {
                throw new Error('콘텐츠 URL이 없습니다.');
            }
            
            // 콘텐츠 타입에 따른 로딩
            if (contentUrl.endsWith('.epub')) {
                await this.loadEpubContent(contentUrl);
            } else if (contentUrl.endsWith('.pdf')) {
                await this.loadPdfContent(contentUrl);
            } else {
                await this.loadHtmlContent(contentUrl);
            }
            
            this.renderCurrentPage();
            this.updateProgress();
            this.generateTableOfContents();
            
        } catch (error) {
            console.error('전자책 로드 오류:', error);
            this.showError('전자책을 불러올 수 없습니다.');
        }
    }
    
    // HTML 콘텐츠 로드
    async loadHtmlContent(contentUrl) {
        try {
            const response = await fetch(contentUrl);
            if (!response.ok) {
                throw new Error('콘텐츠를 가져올 수 없습니다.');
            }
            
            const htmlContent = await response.text();
            this.content = this.parseHtmlContent(htmlContent);
            this.pages = this.paginateContent(this.content);
            this.totalPages = this.pages.length;
            
        } catch (error) {
            // 임시 샘플 콘텐츠 (실제 구현에서는 제거)
            this.content = this.generateSampleContent();
            this.pages = this.paginateContent(this.content);
            this.totalPages = this.pages.length;
        }
    }
    
    // EPUB 콘텐츠 로드 (기본 구현)
    async loadEpubContent(contentUrl) {
        // EPUB 파싱 라이브러리 필요 (epub.js 등)
        console.log('EPUB 로딩:', contentUrl);
        // 임시로 HTML 콘텐츠로 대체
        await this.loadHtmlContent(contentUrl);
    }
    
    // PDF 콘텐츠 로드 (기본 구현)
    async loadPdfContent(contentUrl) {
        // PDF.js 라이브러리 필요
        console.log('PDF 로딩:', contentUrl);
        // 임시로 HTML 콘텐츠로 대체
        await this.loadHtmlContent(contentUrl);
    }
    
    // HTML 콘텐츠 파싱
    parseHtmlContent(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // 불필요한 요소 제거
        const unwantedElements = doc.querySelectorAll('script, style, nav, footer, .advertisement');
        unwantedElements.forEach(el => el.remove());
        
        // 본문 추출
        let content = doc.querySelector('main, article, .content, .book-content');
        if (!content) {
            content = doc.body;
        }
        
        return content.innerHTML;
    }
    
    // 콘텐츠 페이지 분할
    paginateContent(content) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        tempDiv.style.cssText = `
            font-size: ${this.fontSize}px;
            line-height: ${this.lineHeight};
            width: 100%;
            position: absolute;
            top: -9999px;
            visibility: hidden;
        `;
        
        document.body.appendChild(tempDiv);
        
        const pageHeight = window.innerHeight * 0.7; // 페이지 높이의 70%
        const pages = [];
        const elements = Array.from(tempDiv.children);
        
        let currentPageContent = '';
        let currentHeight = 0;
        
        elements.forEach(element => {
            const elementHeight = element.offsetHeight;
            
            if (currentHeight + elementHeight > pageHeight && currentPageContent) {
                pages.push(currentPageContent);
                currentPageContent = element.outerHTML;
                currentHeight = elementHeight;
            } else {
                currentPageContent += element.outerHTML;
                currentHeight += elementHeight;
            }
        });
        
        if (currentPageContent) {
            pages.push(currentPageContent);
        }
        
        document.body.removeChild(tempDiv);
        
        return pages.length > 0 ? pages : [content];
    }
    
    // 현재 페이지 렌더링
    renderCurrentPage() {
        const pageContent = document.getElementById('page-content');
        if (!pageContent || !this.pages.length) return;
        
        pageContent.innerHTML = this.pages[this.currentPage - 1] || '';
        
        // 스타일 적용
        this.applyStyles(pageContent);
        
        // UI 업데이트
        this.updatePageInfo();
        this.updateNavigationButtons();
        this.updatePageSelector();
    }
    
    // 스타일 적용
    applyStyles(container) {
        container.style.cssText = `
            font-size: ${this.fontSize}px;
            line-height: ${this.lineHeight};
            color: ${this.isDarkMode ? '#ecf0f1' : '#2c3e50'};
            font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            word-break: keep-all;
            word-wrap: break-word;
        `;
        
        // 제목 스타일
        const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            heading.style.cssText = `
                color: ${this.isDarkMode ? '#3498db' : '#2c3e50'};
                margin-top: 2rem;
                margin-bottom: 1rem;
                font-weight: 600;
            `;
        });
        
        // 이미지 스타일
        const images = container.querySelectorAll('img');
        images.forEach(img => {
            img.style.cssText = `
                max-width: 100%;
                height: auto;
                border-radius: 8px;
                margin: 1rem 0;
            `;
        });
        
        // 단락 스타일
        const paragraphs = container.querySelectorAll('p');
        paragraphs.forEach(p => {
            p.style.cssText = `
                margin-bottom: 1.5rem;
                text-align: justify;
                text-justify: inter-word;
            `;
        });
    }
    
    // 페이지 정보 업데이트
    updatePageInfo() {
        const currentPageEl = document.getElementById('current-page');
        const totalPagesEl = document.getElementById('total-pages');
        
        if (currentPageEl) currentPageEl.textContent = this.currentPage;
        if (totalPagesEl) totalPagesEl.textContent = this.totalPages;
    }
    
    // 네비게이션 버튼 업데이트
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= this.totalPages;
        }
    }
    
    // 페이지 선택기 업데이트
    updatePageSelector() {
        const pageSelect = document.getElementById('page-select');
        if (!pageSelect) return;
        
        // 옵션 초기화
        pageSelect.innerHTML = '';
        
        for (let i = 1; i <= this.totalPages; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${i} 페이지`;
            if (i === this.currentPage) {
                option.selected = true;
            }
            pageSelect.appendChild(option);
        }
    }
    
    // 진행률 업데이트
    updateProgress() {
        this.readingProgress = Math.round((this.currentPage / this.totalPages) * 100);
        
        const progressBar = document.getElementById('reading-progress');
        if (progressBar) {
            progressBar.style.width = this.readingProgress + '%';
            progressBar.setAttribute('aria-valuenow', this.readingProgress);
        }
        
        // 로컬 스토리지에 진행률 저장
        this.saveReadingProgress();
    }
    
    // 다음 페이지
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.renderCurrentPage();
            this.updateProgress();
            this.saveUserPreferences();
        }
    }
    
    // 이전 페이지
    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderCurrentPage();
            this.updateProgress();
            this.saveUserPreferences();
        }
    }
    
    // 특정 페이지로 이동
    goToPage(pageNumber) {
        const page = parseInt(pageNumber);
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.renderCurrentPage();
            this.updateProgress();
            this.saveUserPreferences();
        }
    }
    
    // 폰트 크기 증가
    increaseFontSize() {
        if (this.fontSize < 24) {
            this.fontSize += 2;
            this.repaginate();
            this.saveUserPreferences();
        }
    }
    
    // 폰트 크기 감소
    decreaseFontSize() {
        if (this.fontSize > 12) {
            this.fontSize -= 2;
            this.repaginate();
            this.saveUserPreferences();
        }
    }
    
    // 다크 모드 토글
    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        
        const ebookPage = document.querySelector('.ebook-page');
        if (ebookPage) {
            ebookPage.classList.toggle('dark-mode', this.isDarkMode);
        }
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = this.isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
        
        this.renderCurrentPage();
        this.saveUserPreferences();
    }
    
    // 북마크 토글
    toggleBookmark() {
        const bookmarkIndex = this.bookmarks.indexOf(this.currentPage);
        
        if (bookmarkIndex > -1) {
            this.bookmarks.splice(bookmarkIndex, 1);
            showToast('북마크가 제거되었습니다.', 'info');
        } else {
            this.bookmarks.push(this.currentPage);
            showToast('북마크가 추가되었습니다.', 'success');
        }
        
        this.updateBookmarkButton();
        this.saveUserPreferences();
    }
    
    // 북마크 버튼 업데이트
    updateBookmarkButton() {
        const bookmarkBtn = document.getElementById('bookmark-toggle');
        if (!bookmarkBtn) return;
        
        const icon = bookmarkBtn.querySelector('i');
        const isBookmarked = this.bookmarks.includes(this.currentPage);
        
        if (icon) {
            icon.className = isBookmarked ? 'fas fa-bookmark' : 'far fa-bookmark';
        }
        
        bookmarkBtn.classList.toggle('active', isBookmarked);
    }
    
    // 재페이지 분할
    repaginate() {
        if (!this.content) return;
        
        const currentPageProgress = (this.currentPage - 1) / this.totalPages;
        
        this.pages = this.paginateContent(this.content);
        this.totalPages = this.pages.length;
        
        // 현재 위치 유지
        this.currentPage = Math.max(1, Math.floor(currentPageProgress * this.totalPages) + 1);
        
        this.renderCurrentPage();
        this.updateProgress();
    }
    
    // 목차 생성
    generateTableOfContents() {
        const toc = [];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.content;
        
        const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        headings.forEach((heading, index) => {
            // 제목이 있는 페이지 찾기
            const pageIndex = this.findPageForElement(heading);
            
            if (pageIndex > -1) {
                toc.push({
                    id: `toc-${index}`,
                    title: heading.textContent.trim(),
                    level: parseInt(heading.tagName.charAt(1)),
                    page: pageIndex + 1
                });
            }
        });
        
        this.tableOfContents = toc;
        this.renderTableOfContents();
    }
    
    // 요소가 포함된 페이지 찾기
    findPageForElement(element) {
        const elementText = element.textContent.trim();
        
        for (let i = 0; i < this.pages.length; i++) {
            if (this.pages[i].includes(elementText)) {
                return i;
            }
        }
        
        return -1;
    }
    
    // 목차 렌더링
    renderTableOfContents() {
        const tocContainer = document.getElementById('table-of-contents');
        if (!tocContainer) return;
        
        if (this.tableOfContents.length === 0) {
            tocContainer.innerHTML = '<p class="text-muted">목차가 없습니다.</p>';
            return;
        }
        
        const tocHtml = this.tableOfContents.map(item => `
            <div class="toc-item toc-level-${item.level}" data-page="${item.page}">
                <a href="#" class="toc-link">
                    <span class="toc-title">${item.title}</span>
                    <span class="toc-page">${item.page}</span>
                </a>
            </div>
        `).join('');
        
        tocContainer.innerHTML = tocHtml;
        
        // 목차 클릭 이벤트
        tocContainer.addEventListener('click', (e) => {
            if (e.target.closest('.toc-link')) {
                e.preventDefault();
                const tocItem = e.target.closest('.toc-item');
                const page = parseInt(tocItem.dataset.page);
                this.goToPage(page);
                this.toggleSidebar(false);
            }
        });
    }
    
    // 사이드바 토글
    toggleSidebar(show = null) {
        const sidebar = document.getElementById('ebook-sidebar');
        if (!sidebar) return;
        
        if (show === null) {
            sidebar.classList.toggle('show');
        } else {
            sidebar.classList.toggle('show', show);
        }
    }
    
    // 이벤트 리스너 설정
    setupEventListeners() {
        // 페이지 네비게이션
        document.getElementById('prev-page')?.addEventListener('click', () => this.prevPage());
        document.getElementById('next-page')?.addEventListener('click', () => this.nextPage());
        
        // 페이지 선택
        document.getElementById('page-select')?.addEventListener('change', (e) => {
            this.goToPage(e.target.value);
        });
        
        // 폰트 크기 조절
        document.getElementById('font-increase')?.addEventListener('click', () => this.increaseFontSize());
        document.getElementById('font-decrease')?.addEventListener('click', () => this.decreaseFontSize());
        
        // 테마 토글
        document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggleDarkMode());
        
        // 북마크 토글
        document.getElementById('bookmark-toggle')?.addEventListener('click', () => this.toggleBookmark());
        
        // 목차 토글
        document.getElementById('toc-toggle')?.addEventListener('click', () => this.toggleSidebar());
        document.getElementById('close-sidebar')?.addEventListener('click', () => this.toggleSidebar(false));
        
        // 폰트 크기 표시 업데이트
        const fontSizeDisplay = document.getElementById('font-size');
        if (fontSizeDisplay) {
            const updateFontDisplay = () => {
                fontSizeDisplay.textContent = `${this.fontSize}px`;
            };
            updateFontDisplay();
            
            document.getElementById('font-increase')?.addEventListener('click', updateFontDisplay);
            document.getElementById('font-decrease')?.addEventListener('click', updateFontDisplay);
        }
    }
    
    // 키보드 단축키
    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // 입력 필드에서는 단축키 비활성화
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch (e.key) {
                case 'ArrowLeft':
                case 'h':
                    e.preventDefault();
                    this.prevPage();
                    break;
                case 'ArrowRight':
                case 'l':
                    e.preventDefault();
                    this.nextPage();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.goToPage(1);
                    break;
                case 'End':
                    e.preventDefault();
                    this.goToPage(this.totalPages);
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    this.increaseFontSize();
                    break;
                case '-':
                    e.preventDefault();
                    this.decreaseFontSize();
                    break;
                case 'b':
                    e.preventDefault();
                    this.toggleBookmark();
                    break;
                case 't':
                    e.preventDefault();
                    this.toggleSidebar();
                    break;
                case 'd':
                    e.preventDefault();
                    this.toggleDarkMode();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.toggleSidebar(false);
                    break;
            }
        });
    }
    
    // 사용자 설정 저장
    saveUserPreferences() {
        const preferences = {
            fontSize: this.fontSize,
            lineHeight: this.lineHeight,
            isDarkMode: this.isDarkMode,
            bookmarks: this.bookmarks,
            currentPage: this.currentPage
        };
        
        localStorage.setItem('ebook-reader-preferences', JSON.stringify(preferences));
    }
    
    // 사용자 설정 로드
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('ebook-reader-preferences');
            if (saved) {
                const preferences = JSON.parse(saved);
                
                this.fontSize = preferences.fontSize || 16;
                this.lineHeight = preferences.lineHeight || 1.8;
                this.isDarkMode = preferences.isDarkMode || false;
                this.bookmarks = preferences.bookmarks || [];
                this.currentPage = preferences.currentPage || 1;
            }
        } catch (error) {
            console.error('설정 로드 오류:', error);
        }
    }
    
    // 읽기 진행률 저장
    saveReadingProgress() {
        const productId = new URLSearchParams(window.location.search).get('id');
        if (productId) {
            const progressData = {
                currentPage: this.currentPage,
                totalPages: this.totalPages,
                progress: this.readingProgress,
                lastRead: new Date().toISOString()
            };
            
            localStorage.setItem(`reading-progress-${productId}`, JSON.stringify(progressData));
        }
    }
    
    // 읽기 진행률 로드
    loadReadingProgress() {
        const productId = new URLSearchParams(window.location.search).get('id');
        if (productId) {
            try {
                const saved = localStorage.getItem(`reading-progress-${productId}`);
                if (saved) {
                    const progressData = JSON.parse(saved);
                    this.currentPage = progressData.currentPage || 1;
                    
                    // 사용자에게 이어서 읽기 제안
                    if (this.currentPage > 1) {
                        const resume = confirm(`${this.currentPage}페이지부터 이어서 읽으시겠습니까?`);
                        if (!resume) {
                            this.currentPage = 1;
                        }
                    }
                }
            } catch (error) {
                console.error('진행률 로드 오류:', error);
            }
        }
    }
    
    // 샘플 콘텐츠 생성 (개발용)
    generateSampleContent() {
        return `
            <h1>전자책 샘플</h1>
            <p>이것은 전자책 리더의 샘플 콘텐츠입니다. 실제 운영 환경에서는 서버에서 제공되는 콘텐츠가 표시됩니다.</p>
            
            <h2>1장. 시작하기</h2>
            <p>전자책 리더는 다양한 기능을 제공합니다. 폰트 크기 조절, 다크 모드, 북마크, 목차 등을 사용할 수 있습니다.</p>
            <p>키보드 단축키도 지원합니다:</p>
            <ul>
                <li>← / h: 이전 페이지</li>
                <li>→ / l: 다음 페이지</li>
                <li>+: 폰트 크기 증가</li>
                <li>-: 폰트 크기 감소</li>
                <li>b: 북마크 토글</li>
                <li>t: 목차 토글</li>
                <li>d: 다크 모드 토글</li>
            </ul>
            
            <h2>2장. 고급 기능</h2>
            <p>전자책 리더는 사용자의 읽기 진행률을 자동으로 저장합니다. 다음에 접속했을 때 이어서 읽을 수 있습니다.</p>
            <p>북마크 기능을 사용하여 중요한 페이지를 표시할 수 있습니다.</p>
            
            <h3>2.1 목차 기능</h3>
            <p>목차를 통해 원하는 섹션으로 빠르게 이동할 수 있습니다.</p>
            
            <h3>2.2 검색 기능</h3>
            <p>향후 업데이트에서 텍스트 검색 기능이 추가될 예정입니다.</p>
            
            <h2>3장. 마무리</h2>
            <p>전자책 리더를 사용해 주셔서 감사합니다. 더 나은 읽기 경험을 위해 지속적으로 개선하겠습니다.</p>
        `;
    }
    
    // 오류 표시
    showError(message) {
        const pageContent = document.getElementById('page-content');
        if (pageContent) {
            pageContent.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <h5>${message}</h5>
                    <p class="text-muted">잠시 후 다시 시도해 주세요.</p>
                </div>
            `;
        }
    }
}

// 전역 인스턴스
let ebookReader;

// 전자책 리더 초기화
function initializeEbookReader(contentUrl) {
    ebookReader = new EbookReader();
    
    if (contentUrl) {
        ebookReader.loadContent(contentUrl);
    }
    
    return ebookReader;
}

// 전역 함수로 내보내기
window.EbookReader = EbookReader;
window.initializeEbookReader = initializeEbookReader;
