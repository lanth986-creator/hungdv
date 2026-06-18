import { useState, useEffect, useCallback } from 'react'
import {
  Modal, Form, Input, Select, DatePicker, Table, Tag, message,
  Popconfirm, Checkbox, Descriptions, Divider, Space, InputNumber,
} from 'antd'
import {
  ScheduleOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, EyeOutlined, LinkOutlined,
  CheckCircleOutlined, ClockCircleOutlined, WarningOutlined,
} from '@ant-design/icons'
import {
  getTasks, getTaskById, createTask, updateTask, deleteTask,
  getTaskReports, createTaskReport, updateTaskReport, deleteTaskReport,
  getPetrovietnamTasks,
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

const loaiXuLyOptions = [
  { label: 'Tạo mới', value: 'tao_moi' },
  { label: 'Tạo phái sinh', value: 'tao_phai_sinh' },
  { label: 'Theo dõi', value: 'theo_doi' },
]

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

const statusOptions = [
  { label: 'Đang triển khai', value: 'dang_trien_khai' },
  { label: 'Hoàn thành', value: 'hoan_thanh' },
  { label: 'Quá hạn', value: 'qua_han' },
]

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

export default function TaskPage() {
  // === State ===
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')
  const [filterSource, setFilterSource] = useState(null)
  const [filterStatus, setFilterStatus] = useState(null)
  const [filterMucDo, setFilterMucDo] = useState(null)
  const [filterLoaiXuLy, setFilterLoaiXuLy] = useState(null)

  // Task modal
  const [taskModalVisible, setTaskModalVisible] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [taskSubmitting, setTaskSubmitting] = useState(false)
  const [taskForm] = Form.useForm()

  // Detail modal
  const [detailVisible, setDetailVisible] = useState(false)
  const [detailTask, setDetailTask] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Report modal
  const [reportModalVisible, setReportModalVisible] = useState(false)
  const [editingReport, setEditingReport] = useState(null)
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportForm] = Form.useForm()
  const [editingRecord, setEditingRecord] = useState(null)

  // Reminder modal
  const [reminderModalVisible, setReminderModalVisible] = useState(false)
  const [reminderSubmitting, setReminderSubmitting] = useState(false)
  const [reminderForm] = Form.useForm()

  // Reference data
  const [documents, setDocuments] = useState([])
  const [categoryTree, setCategoryTree] = useState([])
  const [pvTasks, setPvTasks] = useState([])
  const [allTasks, setAllTasks] = useState([])

  // === Derived category lists ===
  const linhVucItems = categoryTree.filter(c => c.name === 'Lĩnh vực').flatMap(c => c.children || [])
  const lanhDaoItems = categoryTree.filter(c => c.name === 'Lãnh đạo PVEP chỉ đạo').flatMap(c => c.children || [])
  const donViItems = categoryTree.filter(c => c.name === 'Ban, Đơn vị chủ trì thực hiện').flatMap(c => c.children || [])

  const linhVucOptions = linhVucItems.map(c => ({ label: c.name, value: c.id }))
  const lanhDaoOptions = lanhDaoItems.map(c => ({ label: c.name, value: c.id }))
  const donViOptions = donViItems.map(c => ({ label: c.name, value: c.id }))

  // Watch form fields
  const selectedLoaiXuLy = Form.useWatch('loai_xu_ly', taskForm)
  const selectedVanBan = Form.useWatch('van_ban_goc_id', taskForm)
  const selectedParentId = Form.useWatch('parent_id', taskForm)

  // Auto-set linh_vuc + thoi_han from parent task when creating phai sinh
  useEffect(() => {
    if (selectedLoaiXuLy === 'tao_phai_sinh' && selectedParentId) {
      const parent = pvTasks.find(t => t.id === selectedParentId)
      if (parent) {
        if (parent.linh_vuc_id) {
          taskForm.setFieldValue('linh_vuc_id', parent.linh_vuc_id)
        }
        // Auto-fill thoi_han from parent if not yet set
        if (parent.thoi_han_hoan_thanh && !taskForm.getFieldValue('thoi_han_hoan_thanh')) {
          taskForm.setFieldValue('thoi_han_hoan_thanh', dayjs(parent.thoi_han_hoan_thanh))
        }
      }
    }
  }, [selectedLoaiXuLy, selectedParentId, pvTasks, taskForm])

  // Check if selected document is from PVEP (not Petrovietnam)
  const isPvepSource = (() => {
    if (!selectedVanBan) return false
    const doc = documents.find(d => d.id === selectedVanBan)
    return doc && doc.nguon_van_ban && doc.nguon_van_ban !== 'Petrovietnam'
  })()

  // Auto-set nguon_nhiem_vu + ngay_duoc_giao from document
  useEffect(() => {
    if (selectedVanBan) {
      const doc = documents.find(d => d.id === selectedVanBan)
      if (doc) {
        if (doc.nguon_van_ban) {
          taskForm.setFieldValue('nguon_nhiem_vu', doc.nguon_van_ban)
        }
        if (doc.ngay) {
          taskForm.setFieldValue('ngay_duoc_giao', dayjs(doc.ngay))
        }
      }
    }
  }, [selectedVanBan, documents, taskForm])

  // === Fetch data ===
  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getTasks({ search, nguon_nhiem_vu: filterSource, trang_thai: filterStatus,
        muc_do_quan_trong: filterMucDo, loai_xu_ly: filterLoaiXuLy, page, limit })
      setTasks(res.data || [])
      setTotal(res.total || 0)
    } catch (err) {
      message.error(err.message || 'Lỗi tải danh sách công việc')
    } finally {
      setLoading(false)
    }
  }, [search, filterSource, filterStatus, filterMucDo, filterLoaiXuLy, page, limit])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const fetchReferenceData = useCallback(async () => {
    try {
      const [docRes, catRes, pvRes, allRes] = await Promise.all([
        getDocuments({ limit: 100 }),
        getCategoryTree(),
        getPetrovietnamTasks(),
        getTasks({ limit: 1000 }),
      ])
      setDocuments(docRes.data || [])
      setCategoryTree(catRes || [])
      setPvTasks(pvRes || [])
      setAllTasks(allRes.data || [])
    } catch (err) {
      // silent
    }
  }, [])

  useEffect(() => { fetchReferenceData() }, [fetchReferenceData])

  // === Task handlers ===
  const handleCreateTask = () => {
    setEditingTask(null)
    taskForm.resetFields()
    taskForm.setFieldsValue({
      loai_xu_ly: 'tao_moi',
      muc_do_quan_trong: 'trung_binh',
      nhiem_vu_thuong_xuyen: false,
    })
    setTaskModalVisible(true)
  }

  const handleEditTask = (record) => {
    setEditingRecord(record)
    setEditingTask(record)
    taskForm.setFieldsValue({
      loai_xu_ly: record.loai_xu_ly,
      van_ban_goc_id: record.van_ban_goc_id,
      nguon_nhiem_vu: record.nguon_nhiem_vu,
      linh_vuc_id: record.linh_vuc_id,
      noi_dung_nhiem_vu: record.noi_dung_nhiem_vu,
      muc_do_quan_trong: record.muc_do_quan_trong,
      vai_tro_pvep: record.vai_tro_pvep,
      lanh_dao_pvep_ids: record.lanh_dao_pvep?.map(l => l.lanh_dao_id) || (record.lanh_dao_pvep_id ? [record.lanh_dao_pvep_id] : []),
      parent_id: record.parent_id,
      cv_lien_ket_id: record.cv_lien_ket_id,
      ngay_duoc_giao: record.ngay_duoc_giao ? dayjs(record.ngay_duoc_giao) : null,
      thoi_han_hoan_thanh: record.thoi_han_hoan_thanh ? dayjs(record.thoi_han_hoan_thanh) : null,
      nhiem_vu_thuong_xuyen: record.nhiem_vu_thuong_xuyen,
      link_1office: record.link_1office,
    })
    // Set don_vi_chu_tri from detail
    if (record.don_vi_chu_tri) {
      taskForm.setFieldValue('don_vi_chu_tri_ids', record.don_vi_chu_tri.map(u => u.don_vi_id))
    }
    setTaskModalVisible(true)
  }

  const handleDeleteTask = async (id) => {
    try {
      await deleteTask(id)
      message.success('Xóa công việc thành công')
      fetchTasks()
    } catch (err) {
      message.error(err.message || 'Lỗi xóa')
    }
  }

  const handleTaskSubmit = async () => {
    try {
      const values = await taskForm.validateFields()
      setTaskSubmitting(true)

      const payload = {
        ...values,
        ngay_duoc_giao: values.ngay_duoc_giao?.format('YYYY-MM-DD'),
        thoi_han_hoan_thanh: values.thoi_han_hoan_thanh?.format('YYYY-MM-DD'),
        lanh_dao_pvep_id: values.lanh_dao_pvep_ids?.[0] || null,
        lanh_dao_pvep_ids: values.lanh_dao_pvep_ids || [],
        don_vi_chu_tri_ids: values.don_vi_chu_tri_ids || [],
      }

      if (editingTask) {
        await updateTask(editingTask.id, payload)
        message.success('Cập nhật thành công')
      } else {
        await createTask(payload)
        message.success('Tạo mới thành công')
      }
      setTaskModalVisible(false)
      taskForm.resetFields()
      fetchTasks()
    } catch (err) {
      if (err.errorFields) return
      message.error(err.message || 'Lỗi lưu')
    } finally {
      setTaskSubmitting(false)
    }
  }

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
      van_ban_hoan_thanh_id: report.van_ban_hoan_thanh_id,
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
        ngay_hoan_thanh: values.hoan_thanh_trong_thang ? values.ngay_hoan_thanh?.format('YYYY-MM-DD') : null,
        van_ban_hoan_thanh_id: values.hoan_thanh_trong_thang ? values.van_ban_hoan_thanh_id : null,
      }
      if (editingReport) {
        await updateTaskReport(detailTask.id, editingReport.id, payload)
        message.success('Cập nhật báo cáo thành công')
      } else {
        await createTaskReport(detailTask.id, payload)
        message.success('Thêm báo cáo thành công')
      }
      setReportModalVisible(false)
      // Refresh detail
      const updated = await getTaskById(detailTask.id)
      setDetailTask(updated)
      fetchTasks()
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

  const reportHoanThanh = Form.useWatch('hoan_thanh_trong_thang', reportForm)

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

  // === Table columns ===
  const columns = [
    {
      title: 'STT',
      width: 60,
      align: 'center',
      render: (_, __, index) => (page - 1) * limit + index + 1,
    },
    {
      title: 'Loại xử lý',
      dataIndex: 'loai_xu_ly',
      key: 'loai_xu_ly',
      width: 130,
      render: (val) => (
        <Tag color={loaiXuLyColors[val]} style={{ borderRadius: '10px', fontWeight: 500 }}>
          {loaiXuLyLabels[val] || val}
        </Tag>
      ),
    },
    {
      title: 'Nguồn nhiệm vụ',
      dataIndex: 'nguon_nhiem_vu',
      key: 'nguon_nhiem_vu',
      width: 140,
      render: (val) => (
        <Tag color={sourceColors[val] || '#64748b'} style={{ borderRadius: '10px', fontWeight: 500 }}>
          {val}
        </Tag>
      ),
    },
    {
      title: 'Nội dung nhiệm vụ',
      dataIndex: 'noi_dung_nhiem_vu',
      key: 'noi_dung_nhiem_vu',
      width: 350,
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
      width: 140,
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

  // === Report columns ===
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
      title: 'Ngày hoàn thành',
      dataIndex: 'ngay_hoan_thanh',
      width: 120,
      render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : <span style={{ color: '#94a3b8' }}>—</span>,
    },
    {
      title: 'VB hoàn thành',
      dataIndex: 'van_ban_hoan_thanh_so',
      width: 150,
      render: (text, record) => text
        ? <span title={record.van_ban_hoan_thanh_trich_yeu || text}>{text}</span>
        : <span style={{ color: '#94a3b8' }}>—</span>,
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
          <ScheduleOutlined />
          <h1>Quản lý Công việc</h1>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="glass-card-static" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Input
            placeholder="Tìm theo nội dung nhiệm vụ..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            style={{ width: 300, borderRadius: '12px' }}
            allowClear
          />
          <Select
            placeholder="Nguồn nhiệm vụ"
            value={filterSource}
            onChange={(val) => { setFilterSource(val); setPage(1) }}
            options={sourceOptions}
            style={{ width: 170, borderRadius: '12px' }}
            allowClear
          />
          <Select
            placeholder="Trạng thái"
            value={filterStatus}
            onChange={(val) => { setFilterStatus(val); setPage(1) }}
            options={statusOptions}
            style={{ width: 170, borderRadius: '12px' }}
            allowClear
          />
          <Select
            placeholder="Loại xử lý"
            value={filterLoaiXuLy}
            onChange={(val) => { setFilterLoaiXuLy(val); setPage(1) }}
            options={loaiXuLyOptions}
            style={{ width: 170, borderRadius: '12px' }}
            allowClear
          />
          <div style={{ flex: 1 }} />
          <button className="btn-glass-primary" onClick={handleCreateTask}>
            <PlusOutlined /> Tạo công việc
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="glass-table-wrap">
          <Table
            columns={columns}
            dataSource={tasks}
            rowKey="id"
            loading={loading}
            pagination={{
              current: page,
              pageSize: limit,
              total,
              onChange: (p) => setPage(p),
              showSizeChanger: false,
              showTotal: (t) => `Tổng: ${t} công việc`,
            }}
          />
        </div>
      </div>

      {/* ===== Task Create/Edit Modal ===== */}
      <Modal
        title={editingTask ? 'Sửa công việc' : 'Tạo công việc mới'}
        open={taskModalVisible}
        onCancel={() => { setTaskModalVisible(false); taskForm.resetFields() }}
        onOk={handleTaskSubmit}
        confirmLoading={taskSubmitting}
        okText={editingTask ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        className="hungdv-modal"
        width={780}
        destroyOnClose
      >
        <Form form={taskForm} layout="vertical" style={{ marginTop: '16px' }}>
          {/* Loại xử lý */}
          <Form.Item
            name="loai_xu_ly"
            label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Loại xử lý</span>}
            rules={[{ required: true, message: 'Vui lòng chọn loại xử lý' }]}
          >
            <Select options={loaiXuLyOptions} placeholder="Chọn loại xử lý" />
          </Form.Item>

          {/* Parent task info (when tao_phai_sinh) */}
          {selectedLoaiXuLy === 'tao_phai_sinh' && (
            <Form.Item
              name="parent_id"
              label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Công việc cha (Petrovietnam)</span>}
              rules={[{ required: true, message: 'Vui lòng chọn công việc cha' }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Chọn công việc cha từ Petrovietnam"
                options={pvTasks.map(t => ({
                  label: `[${t.so_van_ban || ''}] ${t.noi_dung_nhiem_vu}`,
                  value: t.id,
                }))}
              />
            </Form.Item>
          )}

          {/* Show remaining fields for all types except theo_doi shows less */}
          {selectedLoaiXuLy !== 'theo_doi' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item
                  name="van_ban_goc_id"
                  label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Văn bản gốc</span>}
                  rules={[{ required: true, message: 'Vui lòng chọn văn bản gốc' }]}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="Chọn văn bản gốc"
                    options={documents.map(d => ({
                      label: `${d.so_van_ban} - ${d.trich_yeu?.substring(0, 50)}`,
                      value: d.id,
                    }))}
                  />
                </Form.Item>

                <Form.Item
                  name="nguon_nhiem_vu"
                  label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Nguồn nhiệm vụ</span>}
                  rules={[{ required: true, message: 'Nguồn nhiệm vụ được lấy từ văn bản gốc' }]}
                >
                  <Select
                    options={sourceOptions}
                    placeholder="Tự lấy từ văn bản gốc"
                    disabled
                  />
                </Form.Item>
              </div>

              <Form.Item
                name="linh_vuc_id"
                label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Lĩnh vực</span>}
                rules={[{ required: true, message: 'Vui lòng chọn lĩnh vực' }]}
              >
                <Select options={linhVucOptions} placeholder="Chọn lĩnh vực"
                  disabled={selectedLoaiXuLy === 'tao_phai_sinh'} />
              </Form.Item>

              <Form.Item
                name="noi_dung_nhiem_vu"
                label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Nội dung nhiệm vụ</span>}
                rules={[{ required: true, message: 'Vui lòng nhập nội dung nhiệm vụ' }]}
              >
                <Input.TextArea placeholder="Mô tả công việc cần thực hiện" rows={3} />
              </Form.Item>

              {/* Fields: Mức độ, Vai trò, Lãnh đạo, Ban/Đơn vị */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item
                  name="muc_do_quan_trong"
                  label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Mức độ quan trọng</span>}
                >
                  <Select options={mucDoOptions} placeholder="Chọn mức độ" allowClear />
                </Form.Item>

                <Form.Item
                  name="vai_tro_pvep"
                  label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Vai trò PVEP</span>}
                >
                  <Select options={vaiTroOptions} placeholder="Chọn vai trò" allowClear />
                </Form.Item>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item
                  name="lanh_dao_pvep_ids"
                  label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Lãnh đạo PVEP chỉ đạo</span>}
                >
                  <Select
                    mode="multiple"
                    options={lanhDaoOptions}
                    placeholder="Chọn lãnh đạo"
                    allowClear
                    maxTagCount={2}
                  />
                </Form.Item>

                <Form.Item
                  name="don_vi_chu_tri_ids"
                  label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Ban, Đơn vị chủ trì</span>}
                >
                  <Select
                    mode="multiple"
                    options={donViOptions}
                    placeholder="Chọn ban/đơn vị"
                    allowClear
                    maxTagCount={2}
                  />
                </Form.Item>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item
                  name="ngay_duoc_giao"
                  label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Ngày được giao</span>}
                  rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
                >
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
                </Form.Item>

                <Form.Item
                  name="thoi_han_hoan_thanh"
                  label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Thời hạn hoàn thành</span>}
                  rules={[{
                    validator: (_, value) => {
                      if (!value) return Promise.resolve()
                      const parent = pvTasks.find(t => t.id === selectedParentId)
                      if (parent && parent.thoi_han_hoan_thanh) {
                        const parentDeadline = dayjs(parent.thoi_han_hoan_thanh)
                        if (value.isAfter(parentDeadline, 'day')) {
                          return Promise.reject(new Error(
                            `Thời hạn phải ≤ thời hạn công việc cha (${parentDeadline.format('DD/MM/YYYY')})`
                          ))
                        }
                      }
                      return Promise.resolve()
                    }
                  }]}
                >
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn thời hạn" />
                </Form.Item>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item
                  name="nhiem_vu_thuong_xuyen"
                  valuePropName="checked"
                >
                  <Checkbox>Nhiệm vụ thường xuyên</Checkbox>
                </Form.Item>

                <Form.Item
                  name="link_1office"
                  label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Link 1Office</span>}
                >
                  <Input placeholder="https://..." prefix={<LinkOutlined style={{ color: '#94a3b8' }} />} />
                </Form.Item>
              </div>
            </>
          )}

          {/* Theo doi: minimal fields */}
          {selectedLoaiXuLy === 'theo_doi' && (
            <>
              <Form.Item
                name="noi_dung_nhiem_vu"
                label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Nội dung công việc</span>}
                rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
              >
                <Input.TextArea placeholder="Mô tả công việc cần theo dõi" rows={3} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

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
            <Form.Item
              name="thang"
              label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Tháng</span>}
              rules={[{ required: true, message: 'Vui lòng chọn tháng' }]}
            >
              <Select options={monthOptions} placeholder="Chọn tháng" />
            </Form.Item>
            <Form.Item
              name="nam"
              label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Năm</span>}
              rules={[{ required: true, message: 'Vui lòng nhập năm' }]}
            >
              <InputNumber min={2020} max={2030} style={{ width: '100%' }} placeholder="2025" />
            </Form.Item>
          </div>

          <Form.Item
            name="tinh_hinh_thuc_hien"
            label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Tình hình thực hiện trong tháng</span>}
            rules={[{ required: true, message: 'Vui lòng nhập tình hình thực hiện' }]}
          >
            <Input.TextArea placeholder="Mô tả tình hình thực hiện" rows={3} />
          </Form.Item>

          <Form.Item name="hoan_thanh_trong_thang" valuePropName="checked">
            <Checkbox>Hoàn thành công việc trong tháng?</Checkbox>
          </Form.Item>

          {reportHoanThanh && (
            <>
              <Form.Item
                name="ngay_hoan_thanh"
                label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Ngày hoàn thành</span>}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
              </Form.Item>

              <Form.Item
                name="van_ban_hoan_thanh_id"
                label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Văn bản hoàn thành</span>}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Chọn văn bản hoàn thành"
                  allowClear
                  options={documents.map(d => ({
                    label: `${d.so_van_ban} - ${d.trich_yeu?.substring(0, 50)}`,
                    value: d.id,
                  }))}
                />
              </Form.Item>
            </>
          )}

          {!reportHoanThanh && (
            <>
              <Form.Item
                name="ke_hoach_tiep_theo"
                label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Kế hoạch thực hiện trong kỳ tiếp theo</span>}
              >
                <Input.TextArea placeholder="Kế hoạch thực hiện" rows={2} />
              </Form.Item>

              <Form.Item
                name="de_xuat_kien_nghi"
                label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Đề xuất, kiến nghị</span>}
              >
                <Input.TextArea placeholder="Đề xuất, kiến nghị" rows={2} />
              </Form.Item>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item
                  name="anh_huong_kh"
                  label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Ảnh hưởng đến KH năm</span>}
                >
                  <Select options={[{ label: 'Có', value: 'co' }, { label: 'Không', value: 'khong' }]} />
                </Form.Item>
              </div>

              <Form.Item
                name="danh_gia_nguyen_nhan_cham"
                label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Đánh giá nguyên nhân chậm tiến độ</span>}
              >
                <Input.TextArea placeholder="Đánh giá nguyên nhân" rows={2} />
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
          <Form.Item
            name="van_ban_goc_id"
            label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Văn bản nhắc lại</span>}
          >
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
          <Form.Item
            name="noi_dung_nho_lai"
            label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Nội dung nhắc lại</span>}
            rules={[{ required: true, message: 'Vui lòng nhập nội dung nhắc lại' }]}
          >
            <Input.TextArea placeholder="Nội dung nhắc lại trong văn bản..." rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
