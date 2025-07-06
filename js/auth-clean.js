/**
 * MCSELLER 인증 시스템 (완전 새로 작성 - 순수 Supabase)
 */

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM 로드 완료, 인증 시스템 초기화");
    initializeAuthPage();
});

// 페이지 초기화
function initializeAuthPage() {
    console.log("✅ 인증 페이지 초기화 시작");
    
    // Supabase 클라이언트 확인
    if (!window.supabaseClient) {
        console.error("❌ Supabase 클라이언트를 찾을 수 없습니다.");
        setTimeout(initializeAuthPage, 500);
        return;
    }
    
    console.log("✅ Supabase 클라이언트 확인 완료");
    setupFormEvents();
    setupFormSwitching();
    
    // 로그인 페이지 접근 허용을 위해 세션 확인 완전 제거
}

// 폼 이벤트 설정
function setupFormEvents() {
    console.log("폼 이벤트 설정 중...");
    
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const resetForm = document.getElementById("resetForm");

    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
        console.log("로그인 폼 이벤트 리스너 등록 완료");
    }
    
    if (signupForm) {
        signupForm.addEventListener("submit", handleSignup);
        console.log("회원가입 폼 이벤트 리스너 등록 완료");
    }
    
    if (resetForm) {
        resetForm.addEventListener("submit", handlePasswordReset);
        console.log("비밀번호 재설정 폼 이벤트 리스너 등록 완료");
    }
}

// 폼 전환 설정
function setupFormSwitching() {
    // 로그인으로 전환
    document.querySelectorAll('[onclick*="showLoginForm"]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            showLoginForm();
        });
    });
    
    // 회원가입으로 전환  
    document.querySelectorAll('[onclick*="showSignupForm"]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            showSignupForm();
        });
    });
    
    // 비밀번호 재설정으로 전환
    document.querySelectorAll('[onclick*="showResetForm"]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            showResetForm();
        });
    });
}

// 로그인 폼 표시
function showLoginForm() {
    document.getElementById("loginCard").style.display = "block";
    document.getElementById("signupCard").style.display = "none";
    document.getElementById("resetCard").style.display = "none";
}

// 회원가입 폼 표시
function showSignupForm() {
    document.getElementById("loginCard").style.display = "none";
    document.getElementById("signupCard").style.display = "block";
    document.getElementById("resetCard").style.display = "none";
}

// 비밀번호 재설정 폼 표시
function showResetForm() {
    document.getElementById("loginCard").style.display = "none";
    document.getElementById("signupCard").style.display = "none";
    document.getElementById("resetCard").style.display = "block";
}

// 기존 세션 확인
async function checkExistingSession() {
    try {
        // 페이지가 완전히 로드된 후 세션 확인
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session && session.user) {
            console.log("기존 세션 발견:", session.user.email);
            // 즉시 이동하지 않고 확인 후 이동
            if (confirm("이미 로그인되어 있습니다. 메인페이지로 이동하시겠습니까?")) {
                window.location.href = "index.html";
            }
        } else {
            console.log("기존 세션 없음, 로그인 페이지 유지");
        }
    } catch (error) {
        console.log("세션 확인 중 오류:", error.message);
    }
}

// 로그인 처리
async function handleLogin(e) {
    e.preventDefault();
    console.log("🔐 로그인 처리 시작");
    
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const rememberMe = document.getElementById("rememberMe")?.checked || false;

    console.log("입력값:", { email, password: password ? "있음" : "없음" });

    if (!email || !password) {
        alert("이메일과 비밀번호를 입력해주세요.");
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>로그인 중...';
    submitBtn.disabled = true;

    try {
        console.log("Supabase 로그인 요청 중...");
        
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        console.log("Supabase 응답:", { data, error });

        if (error) {
            console.error("Supabase 오류:", error);
            throw error;
        }

        if (data.user) {
            console.log("✅ 로그인 성공:", data.user.email);
            
            if (rememberMe) {
                localStorage.setItem("rememberEmail", email);
            }
            
            // 세션 저장 및 사용자 정보 전역 설정
            window.currentUser = data.user;
            
            alert("로그인 성공! 마이페이지로 이동합니다.");
            
            // 약간의 지연 후 이동하여 세션이 완전히 설정되도록 함
            setTimeout(() => {
                window.location.href = "mypage.html";
            }, 500);
        } else {
            throw new Error("사용자 정보를 받을 수 없습니다.");
        }
    } catch (error) {
        console.error("❌ 로그인 오류:", error);
        
        let errorMessage = "로그인에 실패했습니다.";
        
        if (error.message.includes("Invalid login credentials")) {
            errorMessage = "이메일 또는 비밀번호가 일치하지 않습니다.";
        } else if (error.message.includes("Email not confirmed")) {
            errorMessage = "이메일 인증이 필요합니다. 이메일을 확인해주세요.";
        } else if (error.message.includes("Too many requests")) {
            errorMessage = "너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.";
        }
        
        alert(errorMessage);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// 회원가입 처리
async function handleSignup(e) {
    e.preventDefault();
    console.log("📝 회원가입 처리 시작");
    
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    console.log("입력값:", { name, email, password: password ? "있음" : "없음" });

    if (!name || !email || !password || !confirmPassword) {
        alert("모든 필드를 입력해주세요.");
        return;
    }

    if (password !== confirmPassword) {
        alert("비밀번호가 일치하지 않습니다.");
        return;
    }

    if (password.length < 6) {
        alert("비밀번호는 6자 이상이어야 합니다.");
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>가입 중...';
    submitBtn.disabled = true;

    try {
        console.log("Supabase 회원가입 요청 중...");
        
        const { data, error } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name,
                }
            }
        });

        console.log("Supabase 회원가입 응답:", { data, error });

        if (error) {
            console.error("Supabase 오류:", error);
            throw error;
        }

        if (data.user) {
            console.log("✅ 회원가입 성공:", data.user.email);
            
            // 세션 저장 및 사용자 정보 전역 설정
            window.currentUser = data.user;
            
            alert("회원가입이 완료되었습니다! 메인페이지로 이동합니다.");
            
            // 약간의 지연 후 이동하여 세션이 완전히 설정되도록 함
            setTimeout(() => {
                window.location.href = "index.html";
            }, 500);
        } else {
            throw new Error("회원가입에 실패했습니다.");
        }
    } catch (error) {
        console.error("❌ 회원가입 오류:", error);
        
        let errorMessage = "회원가입에 실패했습니다.";
        
        if (error.message.includes("User already registered")) {
            errorMessage = "이미 가입된 이메일입니다.";
        } else if (error.message.includes("Password should be at least")) {
            errorMessage = "비밀번호는 6자 이상이어야 합니다.";
        } else if (error.message.includes("Invalid email")) {
            errorMessage = "올바른 이메일 주소를 입력해주세요.";
        }
        
        alert(errorMessage);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// 비밀번호 재설정 처리
async function handlePasswordReset(e) {
    e.preventDefault();
    console.log("🔒 비밀번호 재설정 처리 시작");
    
    const email = document.getElementById("resetEmail").value.trim();

    if (!email) {
        alert("이메일을 입력해주세요.");
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>전송 중...';
    submitBtn.disabled = true;

    try {
        const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email);

        if (error) throw error;

        alert("비밀번호 재설정 링크를 이메일로 전송했습니다.");
        showLoginForm();
    } catch (error) {
        console.error("비밀번호 재설정 오류:", error);
        alert("비밀번호 재설정에 실패했습니다: " + error.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

console.log("auth-clean.js 로드 완료");