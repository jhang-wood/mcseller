// 임시 UI 디버깅 스크립트
setTimeout(function() {
    console.log("=== UI 요소 디버깅 ===");
    
    const loginInfo = document.getElementById("login-info");
    const profileDropdown = document.getElementById("profile-dropdown");
    const startButton = document.getElementById("start-button");
    
    console.log("login-info:", loginInfo, loginInfo ? loginInfo.style.display : "없음");
    console.log("profile-dropdown:", profileDropdown, profileDropdown ? profileDropdown.style.display : "없음");
    console.log("start-button:", startButton, startButton ? startButton.style.display : "없음");
    
    // 강제로 요소들 표시
    if (loginInfo) {
        loginInfo.style.display = 'block';
        loginInfo.style.visibility = 'visible';
        console.log("로그인 버튼 강제 표시");
    }
    
    if (startButton) {
        startButton.style.display = 'block';
        startButton.style.visibility = 'visible';
        console.log("시작하기 버튼 강제 표시");
    }
}, 2000);