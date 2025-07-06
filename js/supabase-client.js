// 1. 여기에 실제 Supabase URL과 Anon Key를 넣으세요.
const supabaseUrl = "https://rpcctgtmtplfahwtnglq.supabase.co";
const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwY2N0Z3RtdHBsZmFod3RuZ2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjUzMTEsImV4cCI6MjA2NjY0MTMxMX0.yv63jWBQIjbzRWh2w6fAu1vgs3W_wQvEL4ePnTD5Sss";

// Supabase 클라이언트 초기화
let supabaseClient;
try {
    if (
        !supabaseUrl ||
        !supabaseAnonKey ||
        supabaseUrl.includes("YOUR_SUPABASE")
    ) {
        throw new Error("Supabase URL 또는 Anon Key가 설정되지 않았습니다.");
    }
    supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);
    console.log("✅ Supabase 클라이언트가 성공적으로 초기화되었습니다.");
} catch (error) {
    console.error("❌ Supabase 초기화 오류:", error.message);
    alert("서비스 연결에 문제가 발생했습니다. 관리자에게 문의하세요.");
}

// [핵심 기능] 현재 사용자가 특정 상품을 구매했는지 확인하는 함수
async function checkPurchase(productId) {
    if (!supabaseClient) return false;

    const {
        data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) return false; // 로그인하지 않은 사용자는 구매 기록 없음

    try {
        const { data, error } = await supabaseClient
            .from("purchases")
            .select("id")
            .eq("user_id", user.id)
            .eq("product_id", productId)
            .single(); // 데이터가 하나만 있거나 없어야 함

        if (error && error.code !== "PGRST116") {
            // PGRST116: 결과 행이 없음 (오류 아님)
            throw error;
        }

        return !!data; // 데이터가 있으면 true, 없으면 false 반환
    } catch (err) {
        console.error("구매 확인 오류:", err);
        return false;
    }
}

// 전역으로 사용할 수 있도록 노출
window.supabaseClient = supabaseClient;
window.checkPurchase = checkPurchase;
