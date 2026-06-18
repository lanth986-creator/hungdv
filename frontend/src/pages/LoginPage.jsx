import { useState } from 'react';
import { Alert, Button, Form, Input, Typography } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Text, Title } = Typography;

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values) => {
    setError('');
    setSubmitting(true);
    try {
      await login(values);
    } catch (err) {
      setError(err.message || 'Đăng nhập không thành công');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="app-background" />
      <main className="login-page">
        <section className="login-panel glass-card-static">
          <div className="login-brand">
            <div className="hungdv-logo-icon">
              <LockOutlined />
            </div>
            <div>
              <Title level={2}>HUNGDV</Title>
              <Text type="secondary">Đăng nhập để sử dụng hệ thống</Text>
            </div>
          </div>

          {error && (
            <Alert
              type="error"
              message={error}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form layout="vertical" onFinish={handleSubmit} autoComplete="off">
            <Form.Item
              label="Tên đăng nhập"
              name="username"
              rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
            >
              <Input prefix={<UserOutlined />} size="large" autoFocus />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            >
              <Input.Password prefix={<LockOutlined />} size="large" />
            </Form.Item>

            <Button
              className="btn-glass-primary login-submit"
              htmlType="submit"
              loading={submitting}
              size="large"
              block
            >
              Đăng nhập
            </Button>
          </Form>
        </section>
      </main>
    </>
  );
}
