/**
 * MCSELLER 인증 시스템 (리팩토링 버전)
 * - 로딩 시점 오류를 해결하기 위해 'supabaseClientReady' 이벤트를 기다린 후 실행됩니다.
 * - 모든 개발/테스트용 코드를 제거하고 프로덕션 코드만 남겼습니다.
 * - 회원가입 시 DB 스키마와 일치하도록 'full_name' 필드를 사용합니다.
 */

// [핵심 개선] Supabase 클라이언트가 준비되었다는 신호를 받으면 페이지 초기화를 시작합니다.
// 이렇게 하면 '서비스 연결 오류'가 발생하는 근본적인 원인이 해결됩니다.
document.addEventListener("supabaseClientReady", initializeAuthPage);

// 페이지 초기화
function initializeAuthPage() {
    console.log("✅ Supabase 준비 완료. 인증 페이지 로직을 초기화합니다.");
    setupFormEvents();
    checkExistingSession();
    setupFormSwitching();
    setupSocialAuth();
}

// 기존 세션 확인 (로그인된 상태면 메인 페이지로 이동)
async function checkExistingSession() {
    const {
        data: { session },
    } = await window.supabaseClient.auth.getSession();
    if (session) {
        window.location.href = "index.html";
    }
}

// 폼 이벤트 설정
function setupFormEvents() {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const resetForm = document.getElementById("resetForm");

    if (loginForm) loginForm.addEventListener("submit", handleLogin);
    if (signupForm) signupForm.addEventListener("submit", handleSignup);
    if (resetForm) resetForm.addEventListener("submit", handlePasswordReset);

    const confirmPassword = document.getElementById("confirmPassword");
    if (confirmPassword)
        confirmPassword.addEventListener("input", validatePasswordMatch);

    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach((input) => {
        input.addEventListener("blur", function () {
            validateEmail(this);
        });
    });

    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach((input) => {
        if (input.id === "signupPassword") {
            input.addEventListener("input", function () {
                showPasswordStrength(this);
            });
        }
    });
}

// 폼 전환 설정
function setupFormSwitching() {
    document.querySelectorAll('[data-form="signup"]').forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            showSignupForm();
        });
    });
    document.querySelectorAll('[data-form="login"]').forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            showLoginForm();
        });
    });
    document.querySelectorAll('[data-form="reset"]').forEach((btn) => {
        btn.addEventListener("click", (e) => {
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

// 로그인 처리
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const rememberMe = document.getElementById("rememberMe").checked;

    if (!email || !password) {
        showToast("이메일과 비밀번호를 입력해주세요.", "warning");
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin me-2"></i>로그인 중...';
    submitBtn.disabled = true;

    try {
        const { data, error } =
            await window.supabaseClient.auth.signInWithPassword({
                email,
                password,
            });

        if (error) throw error;

        if (data.user) {
            if (rememberMe) {
                localStorage.setItem("rememberEmail", email);
            } else {
                localStorage.removeItem("rememberEmail");
            }
            showToast("성공적으로 로그인되었습니다!", "success");
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1500);
        }
    } catch (error) {
        console.error("로그인 오류:", error);
        if (error.message.includes("Invalid login credentials")) {
            showToast("아이디 또는 비밀번호가 일치하지 않습니다.", "error");
        } else {
            showToast(
                "로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
                "error",
            );
        }
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// 회원가입 처리
async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const agreeTerms = document.getElementById("agreeTerms").checked;

    if (!name || !email || !password || !confirmPassword) {
        showToast("모든 필드를 입력해주세요.", "warning");
        return;
    }
    if (password !== confirmPassword) {
        showToast("비밀번호가 일치하지 않습니다.", "warning");
        return;
    }
    if (!agreeTerms) {
        showToast("이용약관에 동의해주세요.", "warning");
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin me-2"></i>가입 중...';
    submitBtn.disabled = true;

    try {
        const { data, error } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    // [핵심 개선] DB의 profiles 테이블 스키마와 필드명을 일치시킵니다.
                    full_name: name,
                },
            },
        });

        if (error) throw error;

        if (data.user) {
            // 이메일 인증이 활성화된 경우, 사용자에게 알려줍니다.
            if (data.user.identities && data.user.identities.length > 0) {
                showToast(
                    "회원가입 성공! 이메일 인증 링크를 확인해주세요.",
                    "info",
                );
                setTimeout(() => showLoginForm(), 3000);
            } else {
                showToast(
                    "이미 가입된 이메일일 수 있습니다. 로그인해주세요.",
                    "warning",
                );
                setTimeout(() => showLoginForm(), 3000);
            }
        }
    } catch (error) {
        console.error("회원가입 오류:", error);
        if (error.message.includes("User already registered")) {
            showToast("이미 가입된 이메일입니다.", "error");
        } else if (error.message.includes("Password")) {
            showToast("비밀번호는 최소 6자 이상이어야 합니다.", "error");
        } else {
            showToast("회원가입 중 오류가 발생했습니다.", "error");
        }
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// 비밀번호 재설정 처리
async function handlePasswordReset(e) {
    e.preventDefault();
    const email = document.getElementById("resetEmail").value.trim();

    if (!email) {
        showToast("이메일을 입력해주세요.", "warning");
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin me-2"></i>전송 중...';
    submitBtn.disabled = true;

    try {
        const { error } =
            await window.supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`, // 비밀번호 재설정 페이지
            });

        if (error) throw error;

        showToast("비밀번호 재설정 링크가 이메일로 전송되었습니다.", "success");
        setTimeout(() => showLoginForm(), 3000);
    } catch (error) {
        console.error("비밀번호 재설정 오류:", error);
        showToast("비밀번호 재설정 중 오류가 발생했습니다.", "error");
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// 소셜 로그인 설정
function setupSocialAuth() {
    document
        .getElementById("kakao-login")
        ?.addEventListener("click", handleKakaoLogin);
    document
        .getElementById("kakao-signup")
        ?.addEventListener("click", handleKakaoLogin);
}

// 카카오 로그인 처리
async function handleKakaoLogin() {
    try {
        const { error } = await window.supabaseClient.auth.signInWithOAuth({
            provider: "kakao",
            options: {
                redirectTo: `${window.location.origin}/index.html`, // 로그인 후 돌아올 페이지
            },
        });
        if (error) throw error;
    } catch (error) {
        console.error("카카오 로그인 오류:", error);
        showToast("카카오 로그인을 사용할 수 없습니다.", "error");
    }
}

// --- 이하 UI 및 유효성 검사 유틸리티 함수 (기존 코드와 동일) ---

function validatePasswordMatch() {
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const confirmInput = document.getElementById("confirmPassword");
    if (confirmPassword && password !== confirmPassword) {
        showFieldError(confirmInput, "비밀번호가 일치하지 않습니다.");
    } else {
        removeFieldError(confirmInput);
    }
}

function validateEmail(input) {
    const email = input.value;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailPattern.test(email)) {
        showFieldError(input, "올바른 이메일 형식을 입력해주세요.");
    } else {
        removeFieldError(input);
    }
}

function showPasswordStrength(input) {
    const password = input.value;
    const strengthBar = createPasswordStrengthBar(input);
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    const strengthTexts = ["매우 약함", "약함", "보통", "강함", "매우 강함"];
    const strengthColors = [
        "#dc3545",
        "#fd7e14",
        "#ffc107",
        "#28a745",
        "#20c997",
    ];
    strengthBar.style.width = `${(strength / 5) * 100}%`;
    strengthBar.style.backgroundColor =
        strengthColors[strength - 1] || "#dee2e6";
    strengthBar.textContent = password
        ? strengthTexts[strength - 1] || "매우 약함"
        : "";
}

function createPasswordStrengthBar(input) {
    let strengthBar = input.parentNode.querySelector(".password-strength");
    if (!strengthBar) {
        strengthBar = document.createElement("div");
        strengthBar.className = "password-strength mt-1 p-1 text-center small";
        strengthBar.style.height = "20px";
        strengthBar.style.borderRadius = "3px";
        strengthBar.style.transition = "all 0.3s ease";
        input.parentNode.appendChild(strengthBar);
    }
    return strengthBar;
}

function showFieldError(input, message) {
    input.classList.add("is-invalid");
    removeFieldError(input);
    const feedback = document.createElement("div");
    feedback.className = "invalid-feedback";
    feedback.textContent = message;
    input.parentNode.appendChild(feedback);
}

function removeFieldError(input) {
    input.classList.remove("is-invalid");
    const feedback = input.parentNode.querySelector(".invalid-feedback");
    if (feedback) feedback.remove();
}

function showToast(message, type = "info") {
    const toastContainer =
        document.getElementById("toastContainer") || createToastContainer();
    const toast = document.createElement("div");
    toast.className = `toast align-items-center text-white bg-${type === "error" ? "danger" : type === "warning" ? "warning" : type === "success" ? "success" : "info"} border-0`;
    toast.setAttribute("role", "alert");
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${type === "error" ? "exclamation-circle" : type === "warning" ? "exclamation-triangle" : type === "success" ? "check-circle" : "info-circle"} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
    bsToast.show();
    toast.addEventListener("hidden.bs.toast", () => {
        toast.remove();
    });
}

function createToastContainer() {
    const container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container position-fixed top-0 end-0 p-3";
    container.style.zIndex = "1055";
    document.body.appendChild(container);
    return container;
}
