-- 혈압 앱 데이터베이스 스키마

-- 1. 혈압 측정 기록 테이블
CREATE TABLE blood_pressure_readings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    systolic INTEGER NOT NULL CHECK (systolic >= 50 AND systolic <= 300),
    diastolic INTEGER NOT NULL CHECK (diastolic >= 30 AND diastolic <= 200),
    pulse INTEGER CHECK (pulse >= 30 AND pulse <= 200),
    weight DECIMAL(5,2) CHECK (weight >= 20 AND weight <= 300),
    notes TEXT,
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 건강 팁 테이블
CREATE TABLE health_tips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('diet', 'exercise', 'lifestyle', 'medication')),
    bp_status VARCHAR(20) CHECK (bp_status IN ('normal', 'elevated', 'high', 'very_high')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 사용자 설정 테이블
CREATE TABLE user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    units_weight VARCHAR(10) DEFAULT 'kg' CHECK (units_weight IN ('kg', 'lbs')),
    units_pressure VARCHAR(10) DEFAULT 'mmHg' CHECK (units_pressure IN ('mmHg', 'kPa')),
    notifications_enabled BOOLEAN DEFAULT TRUE,
    reminder_time TIME DEFAULT '09:00:00',
    target_systolic INTEGER DEFAULT 120,
    target_diastolic INTEGER DEFAULT 80,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 인덱스 생성
CREATE INDEX idx_bp_readings_user_id ON blood_pressure_readings(user_id);
CREATE INDEX idx_bp_readings_measured_at ON blood_pressure_readings(measured_at);
CREATE INDEX idx_bp_readings_user_measured ON blood_pressure_readings(user_id, measured_at DESC);
CREATE INDEX idx_health_tips_category ON health_tips(category);
CREATE INDEX idx_health_tips_bp_status ON health_tips(bp_status);

-- 5. RLS (Row Level Security) 정책 설정
ALTER TABLE blood_pressure_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 혈압 측정 기록 정책
CREATE POLICY "사용자는 본인의 혈압 기록만 조회할 수 있습니다"
ON blood_pressure_readings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "사용자는 본인의 혈압 기록을 생성할 수 있습니다"
ON blood_pressure_readings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 본인의 혈압 기록을 수정할 수 있습니다"
ON blood_pressure_readings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "사용자는 본인의 혈압 기록을 삭제할 수 있습니다"
ON blood_pressure_readings FOR DELETE
USING (auth.uid() = user_id);

-- 사용자 설정 정책
CREATE POLICY "사용자는 본인의 설정만 조회할 수 있습니다"
ON user_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "사용자는 본인의 설정을 생성할 수 있습니다"
ON user_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 본인의 설정을 수정할 수 있습니다"
ON user_settings FOR UPDATE
USING (auth.uid() = user_id);

-- 6. 트리거 함수 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_bp_readings_updated_at
    BEFORE UPDATE ON blood_pressure_readings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. 샘플 건강 팁 데이터 삽입
INSERT INTO health_tips (title, content, category, bp_status) VALUES
('규칙적인 운동하기', '매일 30분씩 유산소 운동을 하면 혈압을 5-10mmHg 낮출 수 있습니다. 걷기, 조깅, 수영 등이 좋습니다.', 'exercise', 'high'),
('나트륨 섭취 줄이기', '하루 나트륨 섭취량을 2300mg 이하로 제한하세요. 가공식품보다는 신선한 음식을 선택하는 것이 좋습니다.', 'diet', 'elevated'),
('충분한 수면 취하기', '하루 7-8시간의 양질의 수면을 취하세요. 수면 부족은 혈압 상승의 원인이 됩니다.', 'lifestyle', 'normal'),
('스트레스 관리하기', '명상, 요가, 심호흡 등으로 스트레스를 관리하세요. 만성 스트레스는 혈압을 높입니다.', 'lifestyle', 'high'),
('금연하기', '담배는 혈압을 일시적으로 높이고 혈관을 손상시킵니다. 금연은 심혈관 건강에 매우 중요합니다.', 'lifestyle', 'very_high'),
('적정 체중 유지하기', '체중 1kg 감소 시 혈압이 약 1mmHg 낮아집니다. 건강한 식단과 운동으로 적정 체중을 유지하세요.', 'diet', 'elevated'),
('정기적인 혈압 측정', '매일 같은 시간에 혈압을 측정하여 변화를 관찰하세요. 아침과 저녁 측정을 권장합니다.', 'lifestyle', 'normal'),
('칼슘과 마그네슘 섭취', '저지방 유제품, 녹색 채소, 견과류로 칼슘과 마그네슘을 충분히 섭취하세요.', 'diet', 'normal');

-- 8. 뷰 생성 (통계를 위한)
CREATE VIEW user_bp_stats AS
SELECT 
    user_id,
    COUNT(*) as total_readings,
    AVG(systolic) as avg_systolic,
    AVG(diastolic) as avg_diastolic,
    AVG(pulse) as avg_pulse,
    MIN(measured_at) as first_reading,
    MAX(measured_at) as last_reading
FROM blood_pressure_readings
GROUP BY user_id;

-- RLS 정책 (건강 팁은 모든 사용자가 조회 가능)
ALTER TABLE health_tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "모든 사용자는 활성화된 건강 팁을 조회할 수 있습니다"
ON health_tips FOR SELECT
USING (is_active = true); 