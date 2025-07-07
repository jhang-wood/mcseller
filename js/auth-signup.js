/**
 * MCSELLER 회원가입 기능
 * 이메일과 비밀번호로 회원가입 처리
 */

// 회원가입 처리 함수
async function signUpWithEmail(email, password, fullName = '') {
    try {
        console.log('🔐 회원가입 시작:', email);
        
        // Supabase 클라이언트 확인
        if (!window.supabaseClient) {
            throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
        }
        
        // 입력값 검증
        if (!email || !password) {
            throw new Error('이메일과 비밀번호를 모두 입력해주세요.');
        }
        
        if (password.length < 6) {
            throw new Error('비밀번호는 최소 6자 이상이어야 합니다.');
        }
        
        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('올바른 이메일 형식이 아닙니다.');
        }
        
        // Supabase Auth를 통한 회원가입
        const { data, error } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName || '',
                    display_name: fullName || email.split('@')[0]
                }
            }
        });
        
        if (error) {
            console.error('회원가입 오류:', error);
            throw error;
        }
        
        if (data.user) {
            console.log('✅ 회원가입 성공:', data.user.email);
            
            // 이메일 확인 필요 여부 체크
            if (!data.user.email_confirmed_at) {
                return {
                    success: true,
                    needsEmailConfirmation: true,
                    message: '회원가입이 완료되었습니다. 이메일을 확인하여 계정을 활성화해주세요.',
                    user: data.user
                };
            } else {
                return {
                    success: true,
                    needsEmailConfirmation: false,
                    message: '회원가입이 완료되었습니다.',
                    user: data.user
                };
            }
        } else {
            throw new Error('회원가입 처리 중 오류가 발생했습니다.');
        }
        
    } catch (error) {
        console.error('회원가입 실패:', error);
        
        // 에러 메시지 한글화
        let errorMessage = error.message;
        
        if (error.message.includes('User already registered')) {
            errorMessage = '이미 가입된 이메일입니다.';
        } else if (error.message.includes('Invalid email')) {
            errorMessage = '유효하지 않은 이메일 형식입니다.';
        } else if (error.message.includes('Password should be at least 6 characters')) {
            errorMessage = '비밀번호는 최소 6자 이상이어야 합니다.';
        } else if (error.message.includes('Signup is disabled')) {
            errorMessage = '현재 회원가입이 비활성화되어 있습니다. 관리자에게 문의하세요.';
        }
        
        return {
            success: false,
            message: errorMessage,
            error: error
        };
    }
}

// 이메일 인증 재전송 함수
async function resendEmailConfirmation(email) {
    try {
        console.log('📧 이메일 인증 재전송:', email);
        
        if (!window.supabaseClient) {
            throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
        }
        
        const { error } = await window.supabaseClient.auth.resend({
            type: 'signup',
            email: email
        });
        
        if (error) {
            throw error;
        }
        
        console.log('✅ 이메일 인증 재전송 완료');
        return {
            success: true,
            message: '인증 이메일이 재전송되었습니다.'
        };
        
    } catch (error) {
        console.error('이메일 재전송 실패:', error);
        return {
            success: false,
            message: '이메일 재전송에 실패했습니다. 잠시 후 다시 시도해주세요.',
            error: error
        };
    }
}

// 로그인 처리 함수
async function signInWithEmail(email, password) {
    try {
        console.log('🔐 로그인 시작:', email);
        
        // Supabase 클라이언트 확인
        if (!window.supabaseClient) {
            throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
        }
        
        // 입력값 검증
        if (!email || !password) {
            throw new Error('이메일과 비밀번호를 모두 입력해주세요.');
        }
        
        // Supabase Auth를 통한 로그인
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('로그인 오류:', error);
            throw error;
        }
        
        if (data.user) {
            console.log('✅ 로그인 성공:', data.user.email);
            
            // 전역 사용자 정보 업데이트
            window.currentUser = data.user;
            
            return {
                success: true,
                message: '로그인되었습니다.',
                user: data.user,
                session: data.session
            };
        } else {
            throw new Error('로그인 처리 중 오류가 발생했습니다.');
        }
        
    } catch (error) {
        console.error('로그인 실패:', error);
        
        // 에러 메시지 한글화
        let errorMessage = error.message;
        
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = '이메일 또는 비밀번호가 잘못되었습니다.';
        } else if (error.message.includes('Email not confirmed')) {
            errorMessage = '이메일 인증을 완료해주세요.';
        } else if (error.message.includes('Too many requests')) {
            errorMessage = '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
        }
        
        return {
            success: false,
            message: errorMessage,
            error: error
        };
    }
}

// 비밀번호 재설정 이메일 전송
async function resetPassword(email) {
    try {
        console.log('🔄 비밀번호 재설정 이메일 전송:', email);
        
        if (!window.supabaseClient) {
            throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
        }
        
        if (!email) {
            throw new Error('이메일을 입력해주세요.');
        }
        
        const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth-callback.html`
        });
        
        if (error) {
            throw error;
        }
        
        console.log('✅ 비밀번호 재설정 이메일 전송 완료');
        return {
            success: true,
            message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.'
        };
        
    } catch (error) {
        console.error('비밀번호 재설정 실패:', error);
        
        let errorMessage = error.message;
        if (error.message.includes('Unable to validate email address')) {
            errorMessage = '유효하지 않은 이메일 주소입니다.';
        }
        
        return {
            success: false,
            message: errorMessage,
            error: error
        };
    }
}

// 현재 사용자 프로필 조회
async function getCurrentUserProfile() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return null;
        }
        
        const { data, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        
        if (error) {
            console.error('프로필 조회 오류:', error);
            return null;
        }
        
        return data;
        
    } catch (error) {
        console.error('프로필 조회 실패:', error);
        return null;
    }
}

// 사용자 프로필 업데이트
async function updateUserProfile(updates) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('로그인이 필요합니다.');
        }
        
        const { data, error } = await window.supabaseClient
            .from('profiles')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select()
            .single();
        
        if (error) {
            throw error;
        }
        
        console.log('✅ 프로필 업데이트 성공');
        return {
            success: true,
            message: '프로필이 업데이트되었습니다.',
            profile: data
        };
        
    } catch (error) {
        console.error('프로필 업데이트 실패:', error);
        return {
            success: false,
            message: '프로필 업데이트에 실패했습니다.',
            error: error
        };
    }
}

// 유틸리티 함수들
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password && password.length >= 6;
}

// 전역 접근을 위한 함수들
window.signUpWithEmail = signUpWithEmail;
window.signInWithEmail = signInWithEmail;
window.resendEmailConfirmation = resendEmailConfirmation;
window.resetPassword = resetPassword;
window.getCurrentUserProfile = getCurrentUserProfile;
window.updateUserProfile = updateUserProfile;
window.validateEmail = validateEmail;
window.validatePassword = validatePassword;

console.log('📁 회원가입/로그인 함수 로드 완료');