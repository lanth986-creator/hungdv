import { DashboardOutlined, FileTextOutlined, ScheduleOutlined } from '@ant-design/icons'

export default function DashboardPage() {
  return (
    <div className="hungdv-page">
      <div className="hungdv-page-header">
        <div className="hungdv-page-title">
          <DashboardOutlined />
          <h1>Tổng quan</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="glass-panel panel-cyan" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#06b6d4', fontSize: '22px'
            }}>
              <DashboardOutlined />
            </div>
            <div>
              <div className="hungdv-text-muted" style={{ fontSize: '0.85rem' }}>Tổng quan</div>
              <div className="hungdv-heading" style={{ fontSize: '1.8rem' }}>--</div>
            </div>
          </div>
          <div className="hungdv-text-muted">Tổng quan hệ thống</div>
        </div>

        <div className="glass-panel panel-purple" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#8b5cf6', fontSize: '22px'
            }}>
              <FileTextOutlined />
            </div>
            <div>
              <div className="hungdv-text-muted" style={{ fontSize: '0.85rem' }}>Văn bản</div>
              <div className="hungdv-heading" style={{ fontSize: '1.8rem' }}>--</div>
            </div>
          </div>
          <div className="hungdv-text-muted">Quản lý văn bản đi đến</div>
        </div>

        <div className="glass-panel panel-pink" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'rgba(236, 72, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ec4899', fontSize: '22px'
            }}>
              <ScheduleOutlined />
            </div>
            <div>
              <div className="hungdv-text-muted" style={{ fontSize: '0.85rem' }}>Công việc</div>
              <div className="hungdv-heading" style={{ fontSize: '1.8rem' }}>--</div>
            </div>
          </div>
          <div className="hungdv-text-muted">Quản lý công việc hiện tại</div>
        </div>
      </div>
    </div>
  )
}
