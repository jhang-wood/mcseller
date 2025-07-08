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

// Payapp Webhook 엔드포인트
app.post('/api/webhook/payapp', async (req, res) => {
    console.log('Payapp webhook received:', req.body);
    
    try {
        const { 
            transaction_id,
            merchant_id,
            amount,
            product_name,
            buyer_email,
            buyer_name,
            status,
            custom_data 
        } = req.body;

        // 결제 완료 상태인 경우에만 처리
        if (status === 'completed' || status === 'success') {
            // custom_data에서 product_id와 user_id 추출
            let productId, userId;
            try {
                const customDataParsed = JSON.parse(custom_data || '{}');
                productId = customDataParsed.product_id;
                userId = customDataParsed.user_id;
            } catch (e) {
                console.error('Custom data parsing error:', e);
            }

            if (!productId || !userId) {
                console.error('Missing product_id or user_id in custom_data');
                return res.status(400).json({ error: 'Invalid custom data' });
            }

            // Supabase를 통한 주문 정보 저장
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
            
            if (supabaseUrl && supabaseKey) {
                const { createClient } = require('@supabase/supabase-js');
                const supabase = createClient(supabaseUrl, supabaseKey);

                // 1. 주문 정보 저장
                const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .insert({
                        user_id: userId,
                        product_id: productId,
                        amount: amount,
                        payment_method: 'payapp',
                        payment_status: 'completed',
                        payapp_transaction_id: transaction_id,
                        payapp_merchant_id: merchant_id,
                        order_id: `PAYAPP_${transaction_id}`
                    })
                    .select()
                    .single();

                if (orderError) {
                    console.error('Order insert error:', orderError);
                    return res.status(500).json({ error: 'Failed to save order' });
                }

                // 2. 구매한 콘텐츠 접근 권한 부여
                const { error: purchaseError } = await supabase
                    .from('purchased_content')
                    .insert({
                        user_id: userId,
                        product_id: productId,
                        order_id: orderData.id
                    });

                if (purchaseError) {
                    console.error('Purchase content insert error:', purchaseError);
                }

                // 3. 슬랙 알림 전송
                if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID) {
                    const { WebClient } = require('@slack/web-api');
                    const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
                    
                    try {
                        await slack.chat.postMessage({
                            channel: process.env.SLACK_CHANNEL_ID,
                            text: `🎉 새로운 결제가 완료되었습니다!`,
                            blocks: [
                                {
                                    type: 'section',
                                    text: {
                                        type: 'mrkdwn',
                                        text: '*💰 새로운 결제 알림*'
                                    }
                                },
                                {
                                    type: 'section',
                                    fields: [
                                        {
                                            type: 'mrkdwn',
                                            text: `*구매자:*\n${buyer_name} (${buyer_email})`
                                        },
                                        {
                                            type: 'mrkdwn',
                                            text: `*상품명:*\n${product_name}`
                                        },
                                        {
                                            type: 'mrkdwn',
                                            text: `*결제금액:*\n₩${amount.toLocaleString()}`
                                        },
                                        {
                                            type: 'mrkdwn',
                                            text: `*거래ID:*\n${transaction_id}`
                                        }
                                    ]
                                },
                                {
                                    type: 'divider'
                                },
                                {
                                    type: 'context',
                                    elements: [
                                        {
                                            type: 'mrkdwn',
                                            text: `결제 시간: ${new Date().toLocaleString('ko-KR')}`
                                        }
                                    ]
                                }
                            ]
                        });
                    } catch (slackError) {
                        console.error('Slack notification error:', slackError);
                    }
                }
            }

            res.json({ success: true, message: 'Webhook processed successfully' });
        } else {
            // 결제 실패 또는 취소 상태 처리
            console.log(`Payment status: ${status}`);
            res.json({ success: true, message: 'Webhook received' });
        }
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// 루트 경로
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
});