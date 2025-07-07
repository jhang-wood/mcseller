-- profiles 테이블 수정
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points integer DEFAULT 0;

-- coupons 테이블 생성
CREATE TABLE IF NOT EXISTS coupons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code varchar(50) UNIQUE NOT NULL,
    discount_type varchar(20) NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value integer NOT NULL,
    max_uses integer DEFAULT 100,
    used_count integer DEFAULT 0,
    expiry_date date NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- contents 테이블 생성
CREATE TABLE IF NOT EXISTS contents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title varchar(255) NOT NULL,
    description text,
    type varchar(20) NOT NULL CHECK (type IN ('ebook', 'course')),
    price integer NOT NULL,
    image_url varchar(500),
    content_url varchar(500) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);
