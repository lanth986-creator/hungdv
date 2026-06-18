import { useState, useEffect, useCallback } from 'react'
import {
  Modal, Form, Input, Select, DatePicker, Table, Tag, message,
  Popconfirm, Checkbox, Descriptions, Divider, Space, InputNumber,
} from 'antd'
import {
  BarChartOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, EyeOutlined, LinkOutlined,
  CheckCircleOutlined, ClockCircleOutlined, WarningOutlined,
  DownOutlined, RightOutlined,
} from '@ant-design/icons'
import {
  getPvnMonthlyReport, getTaskById, updateTask, deleteTask,
  createTaskReport, updateTaskReport, deleteTaskReport,
  createTaskReminder, deleteTaskReminder,
} from '../api/taskApi'
import { getDocuments } from '../api/documentApi'
import { getCategoryTree } from '../api/categoryApi'
import dayjs from 'dayjs'

// === Constants ===
const sourceOptions = [
  { label: 'Petrovietnam', value: 'Petrovietnam' },
  { label: 'HĐTV PVEP', value: 'HĐTV PVEP' },
  { label: 'TGĐ PVEP', value: 'TGĐ PVEP' },
  { label: 'Đảng ủy PVEP', value: 'Đảng ủy PVEP' },
]

const sourceColors = {
  'Petrovietnam': '#3b82f6',
  'HĐTV PVEP': '#8b5cf6',
  'TGĐ PVEP': '#ec4899',
  'Đảng ủy PVEP': '#ef4444',
}

const loaiXuLyColors = {
  'tao_moi': '#06b6d4',
  'tao_phai_sinh': '#8b5cf6',
  'theo_doi': '#64748b',
}

const loaiXuLyLabels = {
  'tao_moi': 'Tạo mới',
  'tao_phai_sinh': 'Tạo phái sinh',
  'theo_doi': 'Theo dõi',
}

const statusConfig = {
  'dang_trien_khai': { color: 'processing', label: 'Đang triển khai', icon: <ClockCircleOutlined /> },
  'hoan_thanh': { color: 'success', label: 'Hoàn thành', icon: <CheckCircleOutlined /> },
  'qua_han': { color: 'error', label: 'Quá hạn', icon: <WarningOutlined /> },
}

const mucDoOptions = [
  { label: 'Cao', value: 'cao' },
  { label: 'Trung bình', value: 'trung_binh' },
  { label: 'Thấp', value: 'thap' },
]

const mucDoColors = {
  'cao': '#ef4444',
  'trung_binh': '#3b82f6',
  'thap': '#64748b',
}

const vaiTroOptions = [
  { label: 'PVEP chủ trì', value: 'chu_tri' },
  { label: 'PVEP phối hợp', value: 'phoi_hop' },
]

const monthOptions = Array.from({ length: 12 }, (_, i) => ({ label: `Tháng ${i + 1}`, value: i + 1 }))

export default function ReportPage() {
  // === State ===
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1)
  const [selectedYear, setSelectedYear] = useState(dayjs().year())

  // Detail modal
  const [detailVisible, setDetailVisible] = useState(false)
  const [detailTask, setDetailTask] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Edit task modal
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editForm] = Form.useForm()

  // Report modal
  const [reportModalVisible, setReportModalVisible] = useState(false)
  const [editingReport, setEditingReport] = useState(null)
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportForm] = Form.useForm()
  const reportHoanThanh = Form.useWatch('hoan_thanh_trong_thang', reportForm)

  // Reminder modal
  const [reminderModalVisible, setReminderModalVisible] = useState(false)
  const [reminderSubmitting, setReminderSubmitting] = useState(false)
  const [reminderForm] = Form.useForm()

  // Reference data
  const [documents, setDocuments] = useState([])
  const [categoryTree, setCategoryTree] = useState([])

  // Derived category lists
  const linhVucItems = categoryTree.filter(c => c.name === 'Lĩnh vực').flatMap(c => c.children || [])
  const lanhDaoItems = categoryTree.filter(c => c.name === 'Lãnh đạo PVEP chỉ đạo').flatMap(c => c.children || [])
  const donViItems = categoryTree.filter(c => c.name === 'Ban, Đơn vị chủ trì thực hiện').flatMap(c => c.children || [])
  const linhVucOptions = linhVucItems.map(c => ({ label: c.name, value: c.id }))
  const lanhDaoOptions = lanhDaoItems.map(c => ({ label: c.name, value: c.id }))
  const donViOptions = donViItems.map(c => ({ label: c.name, value: c.id }))

  // === Fetch data ===
  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPvnMonthlyReport({ thang: selectedMonth, nam: selectedYear })
      setTasks(data || [])
    } catch (err) {
      message.error(err.message || 'Lỗi tải báo cáo')
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => { fetchReport() }, [fetchReport])

  const fetchReferenceData = useCallback(async () => {
    try {
      const [docRes, catRes] = await Promise.all([
        getDocuments({ limit: 100 }),
        getCategoryTree(),
      ])
      setDocuments(docRes.data || [])
      setCategoryTree(catRes || [])
    } catch (err) { /* silent */ }
  }, [])

  useEffect(() => { fetchReferenceData() }, [fetchReferenceData])

  // === Detail handlers ===
  const handleViewDetail = async (record) => {
    setDetailLoading(true)
    setDetailVisible(true)
    try {
      const task = await getTaskById(record.id)
      setDetailTask(task)
    } catch (err) {
      message.error(err.message || 'Lỗi tải chi tiết')
      setDetailVisible(false)
    } finally {
      setDetailLoading(false)
    }
  }

  // === Edit handlers ===
  const handleEditTask = (record) => {
    setEditingTask(record)
    editForm.setFieldsValue({
      loai_xu_ly: record.loai_xu_ly,
      nguon_nhiem_vu: record.nguon_nhiem_vu,
      linh_vuc_id: record.linh_vuc_id,
      noi_dung_nhiem_vu: record.noi_dung_nhiem_vu,
      muc_do_quan_trong: record.muc_do_quan_trong,
      vai_tro_pvep: record.vai_tro_pvep,
      lanh_dao_pvep_id: record.lanh_dao_pvep_id,
      ngay_duoc_giao: record.ngay_duoc_giao ? dayjs(record.ngay_duoc_giao) : null,
      thoi_han_hoan_thanh: record.thoi_han_hoan_thanh ? dayjs(record.thoi_han_hoan_thanh) : null,
      nhiem_vu_thuong_xuyen: record.nhiem_vu_thuong_xuyen,
      link_1office: record.link_1office,
    })
    setEditModalVisible(true)
  }

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields()
      setEditSubmitting(true)
      const payload = {
        ...values,
        ngay_duoc_giao: values.ngay_duoc_giao?.format('YYYY-MM-DD'),
        thoi_han_hoan_thanh: values.thoi_han_hoan_thanh?.format('YYYY-MM-DD'),
      }
      await updateTask(editingTask.id, payload)
      message.success('Cập nhật thành công')
      setEditModalVisible(false)
      fetchReport()
    } catch (err) {
      if (err.errorFields) return
      message.error(err.message || 'Lỗi lưu')
    } finally {
      setEditSubmitting(false)
    }
  }

  // === Delete handlers ===
  const handleDeleteTask = async (id) => {
    try {
      await deleteTask(id)
      message.success('Xóa công việc thành công')
      fetchReport()
    } catch (err) {
      message.error(err.message || 'Lỗi xóa')
    }
  }

  // === Report handlers ===
  const handleAddReport = () => {
    setEditingReport(null)
    reportForm.resetFields()
    const now = dayjs()
    reportForm.setFieldsValue({
      thang: now.month() + 1,
      nam: now.year(),
      hoan_thanh_trong_thang: false,
      anh_huong_kh: 'khong',
    })
    setReportModalVisible(true)
  }

  const handleEditReport = (report) => {
    setEditingReport(report)
    reportForm.setFieldsValue({
      thang: report.thang,
      nam: report.nam,
      tinh_hinh_thuc_hien: report.tinh_hinh_thuc_hien,
      hoan_thanh_trong_thang: report.hoan_thanh_trong_thang,
      ngay_hoan_thanh: report.ngay_hoan_thanh ? dayjs(report.ngay_hoan_thanh) : null,
      ke_hoach_tiep_theo: report.ke_hoach_tiep_theo,
      de_xuat_kien_nghi: report.de_xuat_kien_nghi,
      anh_huong_kh: report.anh_huong_kh,
      danh_gia_nguyen_nhan_cham: report.danh_gia_nguyen_nhan_cham,
    })
    setReportModalVisible(true)
  }

  const handleReportSubmit = async () => {
    try {
      const values = await reportForm.validateFields()
      setReportSubmitting(true)
      const payload = {
        ...values,
        ngay_hoan_thanh: values.ngay_hoan_thanh?.format('YYYY-MM-DD'),
      }
      if (editingReport) {
        await updateTaskReport(detailTask.id, editingReport.id, payload)
        message.success('Cập nhật báo cáo thành công')
      } else {
        await createTaskReport(detailTask.id, payload)
        message.success('Thêm báo cáo thành công')
      }
      setReportModalVisible(false)
      const updated = await getTaskById(detailTask.id)
      setDetailTask(updated)
    } catch (err) {
      if (err.errorFields) return
      message.error(err.message || 'Lỗi lưu báo cáo')
    } finally {
      setReportSubmitting(false)
    }
  }

  const handleDeleteReport = async (reportId) => {
    try {
      await deleteTaskReport(detailTask.id, reportId)
      message.success('Xóa báo cáo thành công')
      const updated = await getTaskById(detailTask.id)
      setDetailTask(updated)
    } catch (err) {
      message.error(err.message || 'Lỗi xóa báo cáo')
    }
  }

  // === Reminder handlers ===
  const handleAddReminder = () => {
    reminderForm.resetFields()
    setReminderModalVisible(true)
  }

  const handleReminderSubmit = async () => {
    try {
      const values = await reminderForm.validateFields()
      setReminderSubmitting(true)
      await createTaskReminder(detailTask.id, values)
      message.success('Thêm lưu ý thành công')
      setReminderModalVisible(false)
      const updated = await getTaskById(detailTask.id)
      setDetailTask(updated)
    } catch (err) {
      if (err.errorFields) return
      message.error(err.message || 'Lỗi lưu lưu ý')
    } finally {
      setReminderSubmitting(false)
    }
  }

  const handleDeleteReminder = async (reminderId) => {
    try {
      await deleteTaskReminder(detailTask.id, reminderId)
      message.success('Xóa lưu ý thành công')
      const updated = await getTaskById(detailTask.id)
      setDetailTask(updated)
    } catch (err) {
      message.error(err.message || 'Lỗi xóa lưu ý')
    }
  }

  // === Year options ===
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    label: dayjs().year() - 2 + i,
    value: dayjs().year() - 2 + i,
  }))

  // === Table columns (parent) ===
  const parentColumns = [
    {
      title: 'STT',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Lĩnh vực',
      dataIndex: 'linh_vuc_name',
      key: 'linh_vuc_name',
      width: 160,
      render: (val) => <span style={{ fontWeight: 500, color: '#1e293b' }}>{val || '—'}</span>,
    },
    {
      title: 'Nội dung nhiệm vụ',
      dataIndex: 'noi_dung_nhiem_vu',
      key: 'noi_dung_nhiem_vu',
      render: (text) => (
        <span style={{ color: '#1e293b', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {text}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trang_thai',
      key: 'trang_thai',
      width: 150,
      render: (val) => {
        const cfg = statusConfig[val] || statusConfig['dang_trien_khai']
        return (
          <Tag color={cfg.color} icon={cfg.icon} style={{ borderRadius: '10px', fontWeight: 500 }}>
            {cfg.label}
          </Tag>
        )
      },
    },
    {
      title: 'Thời hạn',
      dataIndex: 'thoi_han_hoan_thanh',
      key: 'thoi_han_hoan_thanh',
      width: 120,
      render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : <span style={{ color: '#94a3b8' }}>—</span>,
    },
    {
      title: 'Báo cáo',
      key: 'has_report',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const hasReport = record.report_id != null
        return hasReport
          ? <Tag color="success" style={{ borderRadius: '10px' }}>Đã báo cáo</Tag>
          : <Tag color="default" style={{ borderRadius: '10px' }}>Chưa</Tag>
      },
    },
    {
      title: 'Thao tác',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <div className="action-btn-group" style={{ justifyContent: 'center' }}>
          <button className="action-btn" title="Xem chi tiết"
            style={{ color: '#8b5cf6' }}
            onClick={() => handleViewDetail(record)}>
            <EyeOutlined />
          </button>
          <button className="action-btn action-btn-edit" onClick={() => handleEditTask(record)}>
            <EditOutlined />
          </button>
          <Popconfirm
            title="Xóa công việc?"
            description="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDeleteTask(record.id)}
            okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
          >
            <button className="action-btn action-btn-delete">
              <DeleteOutlined />
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ]

  // === Child columns ===
  const childColumns = [
    {
      title: 'STT',
      width: 50,
      render: (_, __, i) => i + 1,
    },
    {
      title: 'Loại',
      dataIndex: 'loai_xu_ly',
      width: 120,
      render: (v) => <Tag color={loaiXuLyColors[v]} style={{ borderRadius: '8px' }}>{loaiXuLyLabels[v] || v}</Tag>,
    },
    {
      title: 'Nguồn',
      dataIndex: 'nguon_nhiem_vu',
      width: 120,
      render: (v) => <Tag color={sourceColors[v] || '#64748b'} style={{ borderRadius: '8px' }}>{v}</Tag>,
    },
    {
      title: 'Nội dung',
      dataIndex: 'noi_dung_nhiem_vu',
      render: (text) => <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trang_thai',
      width: 130,
      render: (val) => {
        const cfg = statusConfig[val] || statusConfig['dang_trien_khai']
        return <Tag color={cfg.color} icon={cfg.icon} style={{ borderRadius: '8px' }}>{cfg.label}</Tag>
      },
    },
    {
      title: 'Báo cáo',
      key: 'has_report',
      width: 100,
      align: 'center',
      render: (_, record) => record.report_id != null
        ? <Tag color="success" style={{ borderRadius: '8px' }}>Đã BC</Tag>
        : <Tag color="default" style={{ borderRadius: '8px' }}>Chưa</Tag>,
    },
    {
      title: 'Thao tác',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <div className="action-btn-group" style={{ justifyContent: 'center' }}>
          <button className="action-btn" title="Xem chi tiết"
            style={{ color: '#8b5cf6' }}
            onClick={() => handleViewDetail(record)}>
            <EyeOutlined />
          </button>
          <button className="action-btn action-btn-edit" onClick={() => handleEditTask(record)}>
            <EditOutlined />
          </button>
        </div>
      ),
    },
  ]

  // === Report columns (for detail modal) ===
  const reportColumns = [
    {
      title: 'Tháng/Năm',
      width: 120,
      align: 'center',
      render: (_, r) => <span style={{ fontWeight: 600 }}>Tháng {r.thang}/{r.nam}</span>,
    },
    {
      title: 'Tình hình thực hiện',
      dataIndex: 'tinh_hinh_thuc_hien',
      ellipsis: true,
      render: (text) => <span title={text}>{text?.length > 60 ? text.substring(0, 60) + '...' : text}</span>,
    },
    {
      title: 'Hoàn thành?',
      dataIndex: 'hoan_thanh_trong_thang',
      width: 100,
      align: 'center',
      render: (val) => val
        ? <Tag color="success" style={{ borderRadius: '10px' }}>Có</Tag>
        : <Tag color="default" style={{ borderRadius: '10px' }}>Không</Tag>,
    },
    {
      title: 'Thao tác',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <div className="action-btn-group" style={{ justifyContent: 'center' }}>
          <button className="action-btn action-btn-edit" onClick={() => handleEditReport(record)}>
            <EditOutlined />
          </button>
          <Popconfirm
            title="Xóa báo cáo?"
            onConfirm={() => handleDeleteReport(record.id)}
            okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
          >
            <button className="action-btn action-btn-delete">
              <DeleteOutlined />
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ]

  // === Render ===
  return (
    <div className="hungdv-page">
      {/* Header */}
      <div className="hungdv-page-header">
        <div className="hungdv-page-title">
          <BarChartOutlined />
          <h1>Báo cáo tháng PVN</h1>
        </div>
      </div>

      {/* Month/Year filter */}
      <div className="glass-card-static" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>Xem báo cáo:</span>
          <Select
            value={selectedMonth}
            onChange={setSelectedMonth}
            options={monthOptions}
            style={{ width: 140, borderRadius: '12px' }}
          />
          <Select
            value={selectedYear}
            onChange={setSelectedYear}
            options={yearOptions}
            style={{ width: 120, borderRadius: '12px' }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="glass-table-wrap">
          <Table
            columns={parentColumns}
            dataSource={tasks}
            rowKey="id"
            loading={loading}
            pagination={false}
            expandable={{
              expandedRowRender: (record) => (
                <Table
                  columns={childColumns}
                  dataSource={record.children || []}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  locale={{ emptyText: 'Không có công việc con' }}
                />
              ),
              rowExpandable: (record) => record.children && record.children.length > 0,
            }}
          />
        </div>
      </div>

      {/* ===== Detail Modal ===== */}
      <Modal
        title="Chi tiết công việc"
        open={detailVisible}
        onCancel={() => { setDetailVisible(false); setDetailTask(null) }}
        footer={null}
        className="hungdv-modal"
        width={900}
        destroyOnClose
      >
        {detailLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Đang tải...</div>
        ) : detailTask && (
          <div style={{ marginTop: '16px' }}>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="Loại xử lý">
                <Tag color={loaiXuLyColors[detailTask.loai_xu_ly]} style={{ borderRadius: '10px' }}>
                  {loaiXuLyLabels[detailTask.loai_xu_ly]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={statusConfig[detailTask.trang_thai]?.color} icon={statusConfig[detailTask.trang_thai]?.icon}
                  style={{ borderRadius: '10px' }}>
                  {statusConfig[detailTask.trang_thai]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Nguồn nhiệm vụ">
                <Tag color={sourceColors[detailTask.nguon_nhiem_vu]} style={{ borderRadius: '10px' }}>
                  {detailTask.nguon_nhiem_vu}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Mức độ">
                <Tag color={mucDoColors[detailTask.muc_do_quan_trong]} style={{ borderRadius: '10px' }}>
                  {mucDoOptions.find(m => m.value === detailTask.muc_do_quan_trong)?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Nội dung nhiệm vụ" span={2}>
                {detailTask.noi_dung_nhiem_vu}
              </Descriptions.Item>
              <Descriptions.Item label="Lĩnh vực">{detailTask.linh_vuc_name || '—'}</Descriptions.Item>
              <Descriptions.Item label="Vai trò PVEP">
                {detailTask.vai_tro_pvep === 'chu_tri' ? 'PVEP chủ trì' : detailTask.vai_tro_pvep === 'phoi_hop' ? 'PVEP phối hợp' : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Lãnh đạo chỉ đạo">{detailTask.lanh_dao_name || '—'}</Descriptions.Item>
              <Descriptions.Item label="Ngày được giao">
                {detailTask.ngay_duoc_giao ? dayjs(detailTask.ngay_duoc_giao).format('DD/MM/YYYY') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Thời hạn">
                {detailTask.thoi_han_hoan_thanh ? dayjs(detailTask.thoi_han_hoan_thanh).format('DD/MM/YYYY') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày hoàn thành">
                {detailTask.ngay_hoan_thanh ? dayjs(detailTask.ngay_hoan_thanh).format('DD/MM/YYYY') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Văn bản gốc" span={2}>
                {detailTask.van_ban_so ? `${detailTask.van_ban_so} (${detailTask.van_ban_nguon})` : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Ban, Đơn vị chủ trì" span={2}>
                {detailTask.don_vi_chu_tri?.length > 0
                  ? detailTask.don_vi_chu_tri.map(u => (
                    <Tag key={u.don_vi_id} style={{ borderRadius: '10px', marginBottom: '4px' }}>{u.don_vi_name}</Tag>
                  ))
                  : '—'}
              </Descriptions.Item>
              {detailTask.link_1office && (
                <Descriptions.Item label="Link 1Office" span={2}>
                  <a href={detailTask.link_1office} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#06b6d4' }}>{detailTask.link_1office}</a>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Children tasks */}
            {detailTask.children && detailTask.children.length > 0 && (
              <>
                <Divider orientation="left" style={{ fontWeight: 600, color: '#0f172a' }}>
                  Công việc con ({detailTask.children.length})
                </Divider>
                <Table
                  dataSource={detailTask.children}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: 'STT', width: 50, render: (_, __, i) => i + 1 },
                    { title: 'Loại', dataIndex: 'loai_xu_ly', width: 100,
                      render: (v) => <Tag color={loaiXuLyColors[v]} style={{ borderRadius: '8px' }}>{loaiXuLyLabels[v]}</Tag> },
                    { title: 'Nội dung', dataIndex: 'noi_dung_nhiem_vu', ellipsis: true },
                    { title: 'Nguồn', dataIndex: 'nguon_nhiem_vu', width: 120,
                      render: (v) => <Tag color={sourceColors[v]} style={{ borderRadius: '8px' }}>{v}</Tag> },
                  ]}
                  style={{ marginBottom: '16px' }}
                />
              </>
            )}

            {/* Reports section */}
            <Divider orientation="left" style={{ fontWeight: 600, color: '#0f172a' }}>
              <Space>
                Báo cáo hàng tháng
                <button className="btn-glass-primary" style={{ height: '28px', padding: '0 12px', fontSize: '0.75rem' }}
                  onClick={handleAddReport}>
                  <PlusOutlined /> Thêm
                </button>
              </Space>
            </Divider>
            <Table
              dataSource={detailTask.reports || []}
              columns={reportColumns}
              rowKey="id"
              size="small"
              pagination={false}
              locale={{ emptyText: 'Chưa có báo cáo' }}
            />

            {/* Reminders section */}
            <Divider orientation="left" style={{ fontWeight: 600, color: '#0f172a' }}>
              <Space>
                Nhắc lại
                <button className="btn-glass-primary" style={{ height: '28px', padding: '0 12px', fontSize: '0.75rem' }}
                  onClick={handleAddReminder}>
                  <PlusOutlined /> Thêm
                </button>
              </Space>
            </Divider>
            {(detailTask.reminders && detailTask.reminders.length > 0) ? (
              detailTask.reminders.map(r => (
                <div key={r.id} style={{
                  padding: '12px 16px', marginBottom: '8px',
                  background: 'rgba(251, 146, 60, 0.08)', borderRadius: '10px',
                  border: '1px solid rgba(251, 146, 60, 0.2)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      {r.van_ban_so && (
                        <Tag color="#f97316" style={{ borderRadius: '8px', marginBottom: '4px' }}>
                          {r.van_ban_so} ({r.van_ban_nguon || ''})
                        </Tag>
                      )}
                      <div style={{ color: '#1e293b', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: '4px' }}>
                        {r.noi_dung_nho_lai}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '4px' }}>
                        {dayjs(r.created_at).format('DD/MM/YYYY HH:mm')}
                      </div>
                    </div>
                    <Popconfirm title="Xóa lưu ý này?" onConfirm={() => handleDeleteReminder(r.id)}
                      okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
                      <button className="action-btn action-btn-delete" style={{ marginLeft: '8px' }}>
                        <DeleteOutlined />
                      </button>
                    </Popconfirm>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: '12px' }}>Chưa có lưu ý nhắc lại</div>
            )}
          </div>
        )}
      </Modal>

      {/* ===== Edit Task Modal ===== */}
      <Modal
        title="Sửa công việc"
        open={editModalVisible}
        onCancel={() => { setEditModalVisible(false); editForm.resetFields() }}
        onOk={handleEditSubmit}
        confirmLoading={editSubmitting}
        okText="Cập nhật"
        cancelText="Hủy"
        className="hungdv-modal"
        width={780}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: '16px' }}>
          <Form.Item name="loai_xu_ly"
            label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Loại xử lý</span>}
            rules={[{ required: true }]}>
            <Select options={[
              { label: 'Tạo mới', value: 'tao_moi' },
              { label: 'Tạo phái sinh', value: 'tao_phai_sinh' },
              { label: 'Theo dõi', value: 'theo_doi' },
            ]} />
          </Form.Item>
          <Form.Item name="nguon_nhiem_vu"
            label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Nguồn nhiệm vụ</span>}
            rules={[{ required: true }]}>
            <Select options={sourceOptions} disabled />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item name="linh_vuc_id"
              label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Lĩnh vực</span>}>
              <Select options={linhVucOptions} placeholder="Chọn lĩnh vực" />
            </Form.Item>
            <Form.Item name="muc_do_quan_trong"
              label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Mức độ quan trọng</span>}>
              <Select options={mucDoOptions} placeholder="Chọn mức độ" allowClear />
            </Form.Item>
          </div>
          <Form.Item name="noi_dung_nhiem_vu"
            label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Nội dung nhiệm vụ</span>}
            rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item name="vai_tro_pvep"
              label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Vai trò PVEP</span>}>
              <Select options={vaiTroOptions} allowClear />
            </Form.Item>
            <Form.Item name="lanh_dao_pvep_id"
              label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Lãnh đạo PVEP</span>}>
              <Select options={lanhDaoOptions} allowClear />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item name="ngay_duoc_giao"
              label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Ngày được giao</span>}
              rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="thoi_han_hoan_thanh"
              label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Thời hạn</span>}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* ===== Report Create/Edit Modal ===== */}
      <Modal
        title={editingReport ? 'Sửa báo cáo' : 'Thêm báo cáo mới'}
        open={reportModalVisible}
        onCancel={() => setReportModalVisible(false)}
        onOk={handleReportSubmit}
        confirmLoading={reportSubmitting}
        okText={editingReport ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
        className="hungdv-modal"
        width={640}
        destroyOnClose
      >
        <Form form={reportForm} layout="vertical" style={{ marginTop: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item name="thang"
              label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Tháng</span>}
              rules={[{ required: true }]}>
              <Select options={monthOptions} />
            </Form.Item>
            <Form.Item name="nam"
              label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Năm</span>}
              rules={[{ required: true }]}>
              <InputNumber min={2020} max={2030} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="tinh_hinh_thuc_hien"
            label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Tình hình thực hiện trong tháng</span>}
            rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="hoan_thanh_trong_thang" valuePropName="checked">
            <Checkbox>Hoàn thành công việc trong tháng?</Checkbox>
          </Form.Item>
          {reportHoanThanh && (
            <Form.Item name="ngay_hoan_thanh"
              label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Ngày hoàn thành</span>}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          )}
          {!reportHoanThanh && (
            <>
              <Form.Item name="ke_hoach_tiep_theo"
                label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Kế hoạch thực hiện trong kỳ tiếp theo</span>}>
                <Input.TextArea rows={2} />
              </Form.Item>
              <Form.Item name="de_xuat_kien_nghi"
                label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Đề xuất, kiến nghị</span>}>
                <Input.TextArea rows={2} />
              </Form.Item>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item name="anh_huong_kh"
                  label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Ảnh hưởng đến KH năm</span>}>
                  <Select options={[{ label: 'Có', value: 'co' }, { label: 'Không', value: 'khong' }]} />
                </Form.Item>
                <div />
              </div>
              <Form.Item name="danh_gia_nguyen_nhan_cham"
                label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Đánh giá nguyên nhân chậm tiến độ</span>}>
                <Input.TextArea rows={2} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* ===== Reminder Create Modal ===== */}
      <Modal
        title="Thêm nhắc lại"
        open={reminderModalVisible}
        onCancel={() => setReminderModalVisible(false)}
        onOk={handleReminderSubmit}
        confirmLoading={reminderSubmitting}
        okText="Thêm"
        cancelText="Hủy"
        className="hungdv-modal"
        width={600}
        destroyOnClose
      >
        <Form form={reminderForm} layout="vertical" style={{ marginTop: '16px' }}>
          <Form.Item name="van_ban_goc_id"
            label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Văn bản nhắc lại</span>}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn văn bản"
              allowClear
              options={documents.map(d => ({
                label: `${d.so_van_ban} - ${d.trich_yeu?.substring(0, 50)}`,
                value: d.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="noi_dung_nho_lai"
            label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Nội dung nhắc lại</span>}
            rules={[{ required: true, message: 'Vui lòng nhập nội dung nhắc lại' }]}>
            <Input.TextArea placeholder="Nội dung nhắc lại trong văn bản..." rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
