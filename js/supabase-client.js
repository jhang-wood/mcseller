/**
 * Supabase 클라이언트 (프로덕션 전용)
 * - 개발/테스트 모드를 모두 제거하고, 실제 서비스 환경에 최적화되었습니다.
 * - 클라이언트 초기화 성공 시, 다른 스크립트가 사용할 수 있도록 'supabaseClientReady' 이벤트를 발생시킵니다.
 */

// ===================================================================================
//  1. 여기에 실제 Supabase URL과 Anon Key를 정확히 입력해주세요. (가장 중요)
// ===================================================================================
// 환경 변수에서 Supabase 설정 가져오기
// server.js를 통해 제공되는 환경 변수를 사용합니다
const supabaseUrl = window.SUPABASE_URL || "https://rpcctgtmtplfahwtnglq.supabase.co";
const supabaseAnonKey = window.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwY2N0Z3RtdHBsZmFod3RuZ2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjUzMTEsImV4cCI6MjA2NjY0MTMxMX0.yv63jWBQIjbzRWh2w6fAu1vgs3W_wQvEL4ePnTD5Sss";

// ===================================================================================
//  클라이언트 초기화
// ===================================================================================
let supabaseClient;

try {
    // URL 또는 Key가 설정되지 않았는지 확인하여 실수를 방지합니다.
    if (
        !supabaseUrl ||
        !supabaseAnonKey ||
        supabaseUrl.includes("YOUR_SUPABASE")
    ) {
        throw new Error(
            "Supabase URL 또는 Anon Key가 설정되지 않았습니다. js/supabase-client.js 파일을 직접 수정해주세요.",
        );
    }

    // Supabase 클라이언트를 생성합니다.
    supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    });

    console.log("✅ Supabase 클라이언트가 성공적으로 초기화되었습니다.");

    // [핵심 개선] 클라이언트가 준비되었다는 신호를 문서 전체에 보냅니다.
    // 이제 다른 스크립트들이 이 신호를 기다렸다가 안전하게 supabaseClient를 사용할 수 있습니다.
    document.dispatchEvent(new CustomEvent("supabaseClientReady"));
} catch (error) {
    console.error(
        "❌ Supabase 초기화에 심각한 오류가 발생했습니다:",
        error.message,
    );
    // 사용자에게 서비스에 문제가 있음을 명확히 알립니다.
    alert(
        "서비스 연결에 문제가 발생했습니다. 페이지를 새로고침하거나 관리자에게 문의하세요.",
    );
}

// ===================================================================================
//  전역 헬퍼 함수
// ===================================================================================

/**
 * 현재 로그인한 사용자가 특정 상품을 구매했는지 확인합니다.
 * @param {string} productId - 확인할 상품의 UUID
 * @returns {Promise<boolean>} 구매했다면 true, 아니면 false
 */
async function checkPurchase(productId) {
    if (!supabaseClient) {
        console.error(
            "구매 확인 실패: Supabase 클라이언트가 준비되지 않았습니다.",
        );
        return false;
    }

    try {
        const {
            data: { user },
        } = await supabaseClient.auth.getUser();
        if (!user) {
            // 로그인하지 않은 사용자는 구매 기록이 있을 수 없습니다.
            return false;
        }

        const { data, error } = await supabaseClient
            .from("purchases") // DB에 생성한 'purchases' 테이블을 조회합니다.
            .select("id", { count: "exact", head: true }) // 전체 데이터를 가져올 필요 없이, 존재 여부만 확인하여 성능을 최적화합니다.
            .eq("user_id", user.id)
            .eq("product_id", productId);

        // head:true 사용 시, count가 0일 때도 오류가 발생하지 않습니다.
        if (error) throw error;

        // count가 1 이상이면 구매한 것입니다.
        return data.count > 0;
    } catch (err) {
        console.error("구매 확인 중 오류 발생:", err);
        return false;
    }
}

// ===================================================================================
//  전역 노출
// ===================================================================================
// 다른 JS 파일에서 `window.supabaseClient` 등으로 접근할 수 있도록 설정합니다.
window.supabaseClient = supabaseClient;
window.checkPurchase = checkPurchase;
