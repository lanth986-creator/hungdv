import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button, Menu } from 'antd'
import {
  DashboardOutlined,
  FileTextOutlined,
  ScheduleOutlined,
  BarChartOutlined,
  SettingOutlined,
  AppstoreOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'

const menuItems = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: 'Tổng quan',
  },
  {
    key: '/documents',
    icon: <FileTextOutlined />,
    label: 'Quản lý văn bản',
  },
  {
    key: '/tasks',
    icon: <ScheduleOutlined />,
    label: 'Quản lý công việc',
  },
  {
    key: '/reports',
    icon: <BarChartOutlined />,
    label: 'Báo cáo',
    children: [
      {
        key: '/reports/pvn-monthly',
        icon: <BarChartOutlined />,
        label: 'Báo cáo tháng PVN',
      },
    ],
  },
  {
    key: 'system',
    icon: <SettingOutlined />,
    label: 'Hệ thống',
    children: [
      {
        key: '/categories',
        icon: <AppstoreOutlined />,
        label: 'Danh mục',
      },
    ],
  },
]

export default function GlassmorphismLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user } = useAuth()
  const [selectedKeys, setSelectedKeys] = useState([location.pathname])

  useEffect(() => {
    setSelectedKeys([location.pathname])
  }, [location.pathname])

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  return (
    <>
      <div className="app-background" />
      <header className="glass-header hungdv-header">
        <div className="hungdv-header-inner">
          <a href="/" className="hungdv-logo">
            <div className="hungdv-logo-icon">
              <AppstoreOutlined />
            </div>
            HUNGDV
          </a>
          <Menu
            mode="horizontal"
            selectedKeys={selectedKeys}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ flex: 1, justifyContent: 'center' }}
          />
          <div className="header-user">
            <span>{user?.displayName || user?.username}</span>
            <Button
              className="btn-glass"
              icon={<LogoutOutlined />}
              onClick={logout}
            >
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>
      <main className="layout-content">
        {children}
      </main>
    </>
  )
}
