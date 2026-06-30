BEGIN;

CREATE TABLE IF NOT EXISTS agent_tools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    parameters_json JSONB NOT NULL,
    handler_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO agent_tools (name, description, parameters_json, handler_type) VALUES
('create_booking', '为用户创建一个面试预约。需要在对话中收集公司名称、预约日期、预约时段、联系人姓名和联系电话等信息。', '{"type":"object","properties":{"company_name":{"type":"string","description":"公司名称"},"company_location":{"type":"string","description":"公司地点"},"booking_date":{"type":"string","description":"预约日期，格式YYYY-MM-DD"},"booking_time":{"type":"string","description":"预约时段，如09:00"},"contact_name":{"type":"string","description":"联系人姓名"},"contact_phone":{"type":"string","description":"联系电话，11位手机号"},"contact_email":{"type":"string","description":"联系邮箱（可选）"},"notes":{"type":"string","description":"备注（可选）"}},"required":["company_name","booking_date","booking_time","contact_name","contact_phone"]}', 'create_booking'),
('query_booking', '查询用户已有的预约。需要用户提供预约编号和手机号。', '{"type":"object","properties":{"id":{"type":"integer","description":"预约编号"},"phone":{"type":"string","description":"注册时使用的手机号"}},"required":["id","phone"]}', 'query_booking'),
('cancel_booking', '取消用户已有的预约。需要用户提供预约编号和手机号。', '{"type":"object","properties":{"id":{"type":"integer","description":"预约编号"},"phone":{"type":"string","description":"注册时使用的手机号"}},"required":["id","phone"]}', 'cancel_booking')
ON CONFLICT (name) DO NOTHING;

COMMIT;
