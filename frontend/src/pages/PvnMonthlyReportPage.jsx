import { useState, useEffect, useCallback } from 'react'
import {
  Modal, Form, Input, Select, DatePicker, Table, Tag, message, Tabs,
  Popconfirm, Checkbox, Descriptions, Divider, Space, InputNumber, Progress,
} from 'antd'
import {
  BarChartOutlined,
  CheckCircleOutlined, ClockCircleOutlined, WarningOutlined,
  DownOutlined, RightOutlined, ApartmentOutlined,
  EyeOutlined, EditOutlined, DeleteOutlined, LinkOutlined, PlusOutlined, DownloadOutlined,
  DashboardOutlined, TeamOutlined, BankOutlined, FileTextOutlined, RiseOutlined,
} from '@ant-design/icons'
import {
  getPvnMonthlyReport, getTaskById, updateTask, deleteTask,
  getPetrovietnamTasks, getTasks, getPvnDashboard,
  createTaskReport, updateTaskReport, deleteTaskReport,
  createTaskReminder, deleteTaskReminder,
} from '../api/taskApi'
import { getDocuments } from '../api/documentApi'
import { getCategoryTree } from '../api/categoryApi'
import ExcelJS from 'exceljs'
import dayjs from 'dayjs'

const monthOptions = Array.from({ length: 12 }, (_, i) => ({ label: `Tháng ${i + 1}`, value: i + 1 }))
const PVN_REPORT_VISIBLE_COLUMNS_KEY = 'pvnMonthlyReport.visibleColumns'
const requiredReportColumnKeys = ['stt', 'noi_dung', 'nguon', 'trang_thai', 'actions']
const defaultReportColumnKeys = [
  'stt',
  'noi_dung',
  'van_ban_goc',
  'nguon',
  'trang_thai',
  'linh_vuc',
  'vai_tro_pvep',
  'lanh_dao_chi_dao',
  'don_vi_chu_tri',
  'ngay_duoc_giao',
  'thoi_han',
  'muc_do',
  'nhiem_vu_thuong_xuyen',
  'link_1office',
  'tinh_hinh',
  'ke_hoach',
  'de_xuat',
  'hoan_thanh_thang',
  'ngay_hoan_thanh',
  'van_ban_hoan_thanh',
  'anh_huong_kh',
  'danh_gia_nguyen_nhan_cham',
  'nguon_vb_hoan_thanh',
  'trich_yeu_vb_hoan_thanh',
  'actions',
]

const normalizeVisibleColumnKeys = (keys) => {
  const selected = Array.isArray(keys) && keys.length > 0 ? keys : defaultReportColumnKeys
  const allowed = new Set(defaultReportColumnKeys)
  return defaultReportColumnKeys.filter(key => requiredReportColumnKeys.includes(key) || (selected.includes(key) && allowed.has(key)))
}

const getInitialVisibleColumnKeys = () => {
  if (typeof window === 'undefined') return defaultReportColumnKeys
  try {
    const saved = window.localStorage.getItem(PVN_REPORT_VISIBLE_COLUMNS_KEY)
    return normalizeVisibleColumnKeys(saved ? JSON.parse(saved) : defaultReportColumnKeys)
  } catch (err) {
    return defaultReportColumnKeys
  }
}

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

const taskSourceOptions = [
  { label: 'Petrovietnam', value: 'Petrovietnam' },
  { label: 'HĐTV PVEP', value: 'HĐTV PVEP' },
  { label: 'TGĐ PVEP', value: 'TGĐ PVEP' },
  { label: 'Đảng ủy PVEP', value: 'Đảng ủy PVEP' },
]

const taskSourceColors = {
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

const mucDoOptions = [
  { label: 'Cao', value: 'cao' },
  { label: 'Trung bình', value: 'trung_binh' },
  { label: 'Thấp', value: 'thap' },
]

const vaiTroOptions = [
  { label: 'PVEP chủ trì', value: 'chu_tri' },
  { label: 'PVEP phối hợp', value: 'phoi_hop' },
]

const statusConfig = {
  'dang_trien_khai': { color: 'processing', label: 'Đang triển khai', icon: <ClockCircleOutlined /> },
  'hoan_thanh': { color: 'success', label: 'Hoàn thành', icon: <CheckCircleOutlined /> },
  'qua_han': { color: 'error', label: 'Quá hạn', icon: <WarningOutlined /> },
}

const mucDoColors = {
  'cao': '#ef4444',
  'trung_binh': '#3b82f6',
  'thap': '#64748b',
}

const mucDoLabels = {
  'cao': 'Cao',
  'trung_binh': 'Trung bình',
  'thap': 'Thấp',
}

export default function PvnMonthlyReportPage() {
  const [month, setMonth] = useState(dayjs().month() + 1)
  const [year, setYear] = useState(dayjs().year())
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedKeys, setExpandedKeys] = useState(new Set())
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(getInitialVisibleColumnKeys)
  const [detailVisible, setDetailVisible] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailTask, setDetailTask] = useState(null)
  const [taskModalVisible, setTaskModalVisible] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [taskSubmitting, setTaskSubmitting] = useState(false)
  const [taskForm] = Form.useForm()
  const [reportModalVisible, setReportModalVisible] = useState(false)
  const [editingReport, setEditingReport] = useState(null)
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportForm] = Form.useForm()
  const [reminderModalVisible, setReminderModalVisible] = useState(false)
  const [reminderSubmitting, setReminderSubmitting] = useState(false)
  const [reminderForm] = Form.useForm()
  const [documents, setDocuments] = useState([])
  const [categoryTree, setCategoryTree] = useState([])
  const [pvTasks, setPvTasks] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [dashboardData, setDashboardData] = useState(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  const linhVucItems = categoryTree.filter(c => c.name === 'Lĩnh vực').flatMap(c => c.children || [])
  const lanhDaoItems = categoryTree.filter(c => c.name === 'Lãnh đạo PVEP chỉ đạo').flatMap(c => c.children || [])
  const donViItems = categoryTree.filter(c => c.name === 'Ban, Đơn vị chủ trì thực hiện').flatMap(c => c.children || [])
  const linhVucOptions = linhVucItems.map(c => ({ label: c.name, value: c.id }))
  const lanhDaoOptions = lanhDaoItems.map(c => ({ label: c.name, value: c.id }))
  const donViOptions = donViItems.map(c => ({ label: c.name, value: c.id }))
  const selectedLoaiXuLy = Form.useWatch('loai_xu_ly', taskForm)
  const selectedVanBan = Form.useWatch('van_ban_goc_id', taskForm)
  const selectedParentId = Form.useWatch('parent_id', taskForm)
  const reportHoanThanh = Form.useWatch('hoan_thanh_trong_thang', reportForm)

  const fetchData = useCallback(async () => {
    if (!month || !year) return
    setLoading(true)
    try {
      const res = await getPvnMonthlyReport({ thang: month, nam: year })
      setData(res || [])
      setExpandedKeys(new Set((res || []).map(p => p.id)))
    } catch (err) {
      message.error(err.message || 'Lỗi tải báo cáo')
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => { fetchData() }, [fetchData])

  const fetchDashboard = useCallback(async () => {
    if (!month || !year) return
    setDashboardLoading(true)
    try {
      const res = await getPvnDashboard({ thang: month, nam: year })
      setDashboardData(res)
    } catch (err) {
      message.error(err.message || 'Lỗi tải dashboard')
    } finally {
      setDashboardLoading(false)
    }
  }, [month, year])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

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
      // Reference data is only needed when editing.
    }
  }, [])

  useEffect(() => { fetchReferenceData() }, [fetchReferenceData])

  useEffect(() => {
    if (selectedLoaiXuLy === 'tao_phai_sinh' && selectedParentId) {
      const parent = pvTasks.find(t => t.id === selectedParentId)
      if (parent) {
        if (parent.linh_vuc_id) taskForm.setFieldValue('linh_vuc_id', parent.linh_vuc_id)
        if (parent.thoi_han_hoan_thanh && !taskForm.getFieldValue('thoi_han_hoan_thanh')) {
          taskForm.setFieldValue('thoi_han_hoan_thanh', dayjs(parent.thoi_han_hoan_thanh))
        }
      }
    }
  }, [selectedLoaiXuLy, selectedParentId, pvTasks, taskForm])

  useEffect(() => {
    if (selectedVanBan) {
      const doc = documents.find(d => d.id === selectedVanBan)
      if (doc) {
        if (doc.nguon_van_ban) taskForm.setFieldValue('nguon_nhiem_vu', doc.nguon_van_ban)
        if (doc.ngay) taskForm.setFieldValue('ngay_duoc_giao', dayjs(doc.ngay))
      }
    }
  }, [selectedVanBan, documents, taskForm])

  const toggleExpand = (id) => {
    setExpandedKeys(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandAll = () => setExpandedKeys(new Set(data.map(p => p.id)))
  const collapseAll = () => setExpandedKeys(new Set())

  const updateVisibleColumnKeys = (keys) => {
    const normalized = normalizeVisibleColumnKeys(keys)
    setVisibleColumnKeys(normalized)
    try {
      window.localStorage.setItem(PVN_REPORT_VISIBLE_COLUMNS_KEY, JSON.stringify(normalized))
    } catch (err) {
      // Ignore localStorage failures; the current selection still applies in memory.
    }
  }

  const showAllColumns = () => updateVisibleColumnKeys(defaultReportColumnKeys)

  // Helper: merge report fields from parent + children
  const mergeReportFields = (parent, children) => {
    const parts = []
    if (parent.tinh_hinh_thuc_hien) {
      parts.push(parent.tinh_hinh_thuc_hien)
    }
    children.forEach(c => {
      if (c.tinh_hinh_thuc_hien) {
        parts.push(c.tinh_hinh_thuc_hien)
      }
    })
    return parts
  }

  const mergeField = (parent, children, field) => {
    const parts = []
    if (parent[field]) {
      parts.push(parent[field])
    }
    children.forEach(c => {
      if (c[field]) parts.push(c[field])
    })
    return parts.length > 0 ? parts : null
  }

  // Flatten: parent row + children rows below
  const tableData = []
  data.forEach((parent, idx) => {
    const children = parent.children || []
    const isExpanded = expandedKeys.has(parent.id)

    // Merge report data for parent row
    const mergedTinhHinh = mergeReportFields(parent, children)
    const mergedKeHoach = mergeField(parent, children, 'ke_hoach_tiep_theo')
    const mergedDeXuat = mergeField(parent, children, 'de_xuat_kien_nghi')
    const mergedAnhHuong = mergeField(parent, children, 'anh_huong_kh')
    const mergedDanhGia = mergeField(parent, children, 'danh_gia_nguyen_nhan_cham')

    // Determine if parent has any report at all
    const parentHasReport = parent.tinh_hinh_thuc_hien || children.some(c => c.tinh_hinh_thuc_hien)

    tableData.push({
      _key: `p-${parent.id}`,
      _type: 'parent',
      _id: parent.id,
      _task: parent,
      _isExpanded: isExpanded,
      _childCount: children.length,
      stt: idx + 1,
      noi_dung: parent.noi_dung_nhiem_vu,
      van_ban_goc: parent.van_ban_so,
      nguon: parent.nguon_nhiem_vu,
      trang_thai: parent.trang_thai,
      linh_vuc: parent.linh_vuc_name,
      vai_tro_pvep: parent.vai_tro_pvep,
      lanh_dao_chi_dao: parent.lanh_dao_name,
      don_vi_chu_tri: parent.don_vi_chu_tri_names,
      ngay_duoc_giao: parent.ngay_duoc_giao,
      thoi_han: parent.thoi_han_hoan_thanh,
      muc_do: parent.muc_do_quan_trong,
      nhiem_vu_thuong_xuyen: parent.nhiem_vu_thuong_xuyen,
      link_1office: parent.link_1office,
      // Merged report fields
      tinh_hinh: mergedTinhHinh,
      tinh_hinh_has_report: parentHasReport,
      ke_hoach: mergedKeHoach,
      de_xuat: mergedDeXuat,
      anh_huong: mergedAnhHuong,
      danh_gia: mergedDanhGia,
      // Original values for summary
      _hoan_thanh_thang: parent.hoan_thanh_trong_thang || children.some(c => c.hoan_thanh_trong_thang),
      _ngay_hoan_thanh: parent.report_ngay_hoan_thanh || children.find(c => c.report_ngay_hoan_thanh)?.report_ngay_hoan_thanh,
      _van_ban_hoan_thanh_so: parent.van_ban_hoan_thanh_so || children.find(c => c.van_ban_hoan_thanh_so)?.van_ban_hoan_thanh_so,
      _van_ban_hoan_thanh_trich_yeu: parent.van_ban_hoan_thanh_trich_yeu || children.find(c => c.van_ban_hoan_thanh_trich_yeu)?.van_ban_hoan_thanh_trich_yeu,
      _van_ban_hoan_thanh_nguon: parent.van_ban_hoan_thanh_nguon || children.find(c => c.van_ban_hoan_thanh_nguon)?.van_ban_hoan_thanh_nguon,
    })

    if (isExpanded) {
      children.forEach((child, ci) => {
        tableData.push({
          _key: `c-${child.id}`,
          _type: 'child',
          _id: child.id,
          _task: child,
          _parentId: parent.id,
          _parentIdx: idx,
          stt: `${idx + 1}.${ci + 1}`,
          noi_dung: child.noi_dung_nhiem_vu,
          van_ban_goc: child.van_ban_so,
          nguon: child.nguon_nhiem_vu,
          trang_thai: child.trang_thai,
          linh_vuc: child.linh_vuc_name,
          vai_tro_pvep: child.vai_tro_pvep,
          lanh_dao_chi_dao: child.lanh_dao_name,
          don_vi_chu_tri: child.don_vi_chu_tri_names,
          ngay_duoc_giao: child.ngay_duoc_giao,
          thoi_han: child.thoi_han_hoan_thanh,
          muc_do: child.muc_do_quan_trong,
          nhiem_vu_thuong_xuyen: child.nhiem_vu_thuong_xuyen,
          link_1office: child.link_1office,
          tinh_hinh: child.tinh_hinh_thuc_hien,
          tinh_hinh_has_report: !!child.tinh_hinh_thuc_hien,
          ke_hoach: child.ke_hoach_tiep_theo,
          de_xuat: child.de_xuat_kien_nghi,
          anh_huong: child.anh_huong_kh,
          danh_gia: child.danh_gia_nguyen_nhan_cham,
          hoan_thanh_thang: child.hoan_thanh_trong_thang,
          ngay_hoan_thanh: child.report_ngay_hoan_thanh,
          van_ban_hoan_thanh_so: child.van_ban_hoan_thanh_so,
          van_ban_hoan_thanh_nguon: child.van_ban_hoan_thanh_nguon,
          van_ban_hoan_thanh_trich_yeu: child.van_ban_hoan_thanh_trich_yeu,
        })
      })
    }
  })

  const totalParents = data.length
  const totalChildren = data.reduce((sum, p) => sum + (p.children?.length || 0), 0)
  const totalWithReport = data.filter(p => p.tinh_hinh_thuc_hien).length +
    data.reduce((sum, p) => sum + (p.children?.filter(c => c.tinh_hinh_thuc_hien).length || 0), 0)
  const totalCompleted = data.filter(p => p.hoan_thanh_trong_thang).length +
    data.reduce((sum, p) => sum + (p.children?.filter(c => c.hoan_thanh_trong_thang).length || 0), 0)

  const handleViewDetail = async (record) => {
    setDetailLoading(true)
    setDetailVisible(true)
    try {
      const task = await getTaskById(record._id)
      setDetailTask(task)
    } catch (err) {
      message.error(err.message || 'Lỗi tải chi tiết')
      setDetailVisible(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const fillTaskForm = (task) => {
    setEditingTask(task)
    taskForm.setFieldsValue({
      loai_xu_ly: task.loai_xu_ly,
      van_ban_goc_id: task.van_ban_goc_id,
      nguon_nhiem_vu: task.nguon_nhiem_vu,
      linh_vuc_id: task.linh_vuc_id,
      noi_dung_nhiem_vu: task.noi_dung_nhiem_vu,
      muc_do_quan_trong: task.muc_do_quan_trong,
      vai_tro_pvep: task.vai_tro_pvep,
      lanh_dao_pvep_ids: task.lanh_dao_pvep?.map(l => l.lanh_dao_id) || (task.lanh_dao_pvep_id ? [task.lanh_dao_pvep_id] : []),
      parent_id: task.parent_id,
      cv_lien_ket_id: task.cv_lien_ket_id,
      ngay_duoc_giao: task.ngay_duoc_giao ? dayjs(task.ngay_duoc_giao) : null,
      thoi_han_hoan_thanh: task.thoi_han_hoan_thanh ? dayjs(task.thoi_han_hoan_thanh) : null,
      nhiem_vu_thuong_xuyen: task.nhiem_vu_thuong_xuyen,
      link_1office: task.link_1office,
      don_vi_chu_tri_ids: task.don_vi_chu_tri?.map(u => u.don_vi_id) || [],
    })
    setTaskModalVisible(true)
  }

  const handleEditTask = async (record) => {
    try {
      const task = await getTaskById(record._id)
      fillTaskForm(task)
    } catch (err) {
      message.error(err.message || 'Lỗi tải công việc')
    }
  }

  const handleDeleteTask = async (record) => {
    try {
      await deleteTask(record._id)
      message.success('Xóa công việc thành công')
      fetchData()
      fetchDashboard()
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
      await updateTask(editingTask.id, payload)
      message.success('Cập nhật thành công')
      setTaskModalVisible(false)
      taskForm.resetFields()
      setEditingTask(null)
      fetchData()
      fetchDashboard()
      if (detailTask?.id === editingTask.id) {
        setDetailTask(await getTaskById(editingTask.id))
      }
    } catch (err) {
      if (err.errorFields) return
      message.error(err.message || 'Lỗi lưu')
    } finally {
      setTaskSubmitting(false)
    }
  }

  const refreshDetailTask = async () => {
    if (!detailTask?.id) return
    const updated = await getTaskById(detailTask.id)
    setDetailTask(updated)
  }

  const handleAddReport = () => {
    setEditingReport(null)
    reportForm.resetFields()
    reportForm.setFieldsValue({
      thang: month || dayjs().month() + 1,
      nam: year || dayjs().year(),
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
      await refreshDetailTask()
      fetchData()
      fetchDashboard()
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
      await refreshDetailTask()
      fetchData()
      fetchDashboard()
    } catch (err) {
      message.error(err.message || 'Lỗi xóa báo cáo')
    }
  }

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
      await refreshDetailTask()
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
      await refreshDetailTask()
    } catch (err) {
      message.error(err.message || 'Lỗi xóa lưu ý')
    }
  }

  // === Export Excel ===
  const statusLabel = (val) => {
    const cfg = statusConfig[val]
    return cfg ? cfg.label : 'Đang triển khai'
  }

  const mucDoLabel = (val) => {
    return mucDoLabels[val] || '—'
  }

  const vaiTroLabel = (val) => {
    if (val === 'chu_tri') return 'PVEP chủ trì'
    if (val === 'phoi_hop') return 'PVEP phối hợp'
    return '—'
  }

  const formatDate = (text) => {
    return text ? dayjs(text).format('DD/MM/YYYY') : ''
  }

  const joinArray = (val) => {
    if (!val) return ''
    if (Array.isArray(val)) return val.filter(Boolean).join('\n')
    return String(val)
  }

  const handleExportExcel = async () => {
    if (!data || data.length === 0) {
      message.warning('Không có dữ liệu để export')
      return
    }

    const wb = new ExcelJS.Workbook()
    wb.creator = 'HUNGDV'
    wb.created = new Date()

    const ws = wb.addWorksheet('Báo cáo tháng PVN', {
      views: [{ state: 'frozen', ySplit: 3 }],
    })

    // --- Styles ---
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } }
    const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Arial' }
    const parentFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    const parentFont = { bold: true, size: 11, name: 'Arial' }
    const childFont = { size: 10, name: 'Arial', color: { argb: 'FF334155' } }
    const thinBorder = {
      top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    }
    const wrapAlign = { vertical: 'middle', wrapText: true }

    // --- Title row ---
    ws.mergeCells('A1:V1')
    const titleCell = ws.getCell('A1')
    titleCell.value = `BÁO CÁO THÁNG PVN - Tháng ${month}/${year}`
    titleCell.font = { bold: true, size: 14, name: 'Arial', color: { argb: 'FF1E3A5F' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(1).height = 30

    // --- Summary row ---
    ws.mergeCells('A2:V2')
    const summaryCell = ws.getCell('A2')
    summaryCell.value = `Tổng: ${totalParents} công việc cha, ${totalChildren} công việc phái sinh | Đ có báo cáo: ${totalWithReport} | Hoàn thành: ${totalCompleted}`
    summaryCell.font = { size: 10, name: 'Arial', color: { argb: 'FF64748B' }, italic: true }
    summaryCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(2).height = 22

    // --- Headers ---
    const headers = [
      { key: 'stt', label: 'STT', width: 8 },
      { key: 'noi_dung', label: 'Nội dung nhiệm vụ', width: 45 },
      { key: 'nguon', label: 'Nguồn', width: 14 },
      { key: 'trang_thai', label: 'Trạng thái', width: 16 },
      { key: 'linh_vuc', label: 'Lĩnh vực', width: 18 },
      { key: 'vai_tro', label: 'Vai trò PVEP', width: 16 },
      { key: 'lanh_dao', label: 'Lãnh đạo chỉ đạo', width: 20 },
      { key: 'don_vi', label: 'Đơn vị chủ trì', width: 22 },
      { key: 'ngay_giao', label: 'Ngày được giao', width: 14 },
      { key: 'thoi_han', label: 'Thời hạn', width: 14 },
      { key: 'muc_do', label: 'Mức độ', width: 12 },
      { key: 'tinh_hinh', label: 'Tình hình thực hiện', width: 55 },
      { key: 'ke_hoach', label: 'Kế hoạch tiếp theo', width: 40 },
      { key: 'de_xuat', label: 'Đề xuất/Kiến nghị', width: 35 },
      { key: 'ht_thang', label: 'HT trong tháng', width: 14 },
      { key: 'ngay_ht', label: 'Ngày hoàn thành', width: 14 },
      { key: 'anh_huong', label: 'Ảnh hưởng KH', width: 14 },
      { key: 'danh_gia', label: 'Đánh giá nguyên nhân chậm', width: 35 },
    ]

    const headerRow = ws.getRow(3)
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1)
      cell.value = h.label
      cell.fill = headerFill
      cell.font = headerFont
      cell.border = thinBorder
      cell.alignment = { ...wrapAlign, horizontal: 'center' }
      ws.getColumn(i + 1).width = h.width
    })
    headerRow.height = 28

    // --- Data rows with grouping ---
    let currentRow = 4
    let groupIndex = 0

    data.forEach((parent, idx) => {
      const children = parent.children || []
      const hasChildren = children.length > 0
      const mergedTinhHinh = joinArray(
        [parent.tinh_hinh_thuc_hien, ...children.map(c => c.tinh_hinh_thuc_hien)].filter(Boolean)
      )
      const mergedKeHoach = joinArray(
        [parent.ke_hoach_tiep_theo, ...children.map(c => c.ke_hoach_tiep_theo)].filter(Boolean)
      )
      const mergedDeXuat = joinArray(
        [parent.de_xuat_kien_nghi, ...children.map(c => c.de_xuat_kien_nghi)].filter(Boolean)
      )
      const mergedDanhGia = joinArray(
        [parent.danh_gia_nguyen_nhan_cham, ...children.map(c => c.danh_gia_nguyen_nhan_cham)].filter(Boolean)
      )
      const mergedAnhHuong = [parent.anh_huong_kh, ...children.map(c => c.anh_huong_kh)].find(Boolean) || ''
      const parentHtThang = parent.hoan_thanh_trong_thang || children.some(c => c.hoan_thanh_trong_thang)
      const parentNgayHt = parent.report_ngay_hoan_thanh || children.find(c => c.report_ngay_hoan_thanh)?.report_ngay_hoan_thanh

      const parentRow = ws.getRow(currentRow)
      const parentValues = [
        idx + 1,
        parent.noi_dung_nhiem_vu,
        parent.nguon_nhiem_vu,
        statusLabel(parent.trang_thai),
        parent.linh_vuc_name || '',
        vaiTroLabel(parent.vai_tro_pvep),
        parent.lanh_dao_name || '',
        parent.don_vi_chu_tri_names || '',
        formatDate(parent.ngay_duoc_giao),
        formatDate(parent.thoi_han_hoan_thanh),
        mucDoLabel(parent.muc_do_quan_trong),
        mergedTinhHinh,
        mergedKeHoach,
        mergedDeXuat,
        parentHtThang ? 'Có' : 'Không',
        formatDate(parentNgayHt),
        mergedAnhHuong === 'co' ? 'Có' : mergedAnhHuong === 'khong' ? 'Không' : '',
        mergedDanhGia,
      ]

      parentValues.forEach((val, i) => {
        const cell = parentRow.getCell(i + 1)
        cell.value = val
        cell.fill = parentFill
        cell.font = parentFont
        cell.border = thinBorder
        cell.alignment = wrapAlign
      })

      // Group start for children
      if (hasChildren) {
        ws.getRow(currentRow).outlineLevel = 0
        groupIndex++
      }

      currentRow++

      // Children rows
      if (hasChildren) {
        children.forEach((child, ci) => {
          const childRow = ws.getRow(currentRow)
          const childValues = [
            `${idx + 1}.${ci + 1}`,
            child.noi_dung_nhiem_vu,
            child.nguon_nhiem_vu,
            statusLabel(child.trang_thai),
            child.linh_vuc_name || '',
            vaiTroLabel(child.vai_tro_pvep),
            child.lanh_dao_name || '',
            child.don_vi_chu_tri_names || '',
            formatDate(child.ngay_duoc_giao),
            formatDate(child.thoi_han_hoan_thanh),
            mucDoLabel(child.muc_do_quan_trong),
            child.tinh_hinh_thuc_hien || '',
            child.ke_hoach_tiep_theo || '',
            child.de_xuat_kien_nghi || '',
            child.hoan_thanh_trong_thang ? 'Có' : 'Không',
            formatDate(child.report_ngay_hoan_thanh),
            child.anh_huong_kh === 'co' ? 'Có' : child.anh_huong_kh === 'khong' ? 'Không' : '',
            child.danh_gia_nguyen_nhan_cham || '',
          ]

          childValues.forEach((val, i) => {
            const cell = childRow.getCell(i + 1)
            cell.value = val
            cell.font = childFont
            cell.border = thinBorder
            cell.alignment = wrapAlign
          })

          // Set outline level for grouping (collapse/expand in Excel)
          childRow.outlineLevel = 1

          currentRow++
        })
      }
    })

    // Auto-filter
    ws.autoFilter = {
      from: { row: 3, column: 1 },
      to: { row: currentRow - 1, column: headers.length },
    }

    // Generate file
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `BaoCaoThang_PVN_${month}_${year}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
    message.success('Export thành công')
  }

  const columns = [
    {
      key: 'stt',
      label: 'STT',
      required: true,
      title: 'STT',
      dataIndex: 'stt',
      width: 70,
      align: 'center',
      render: (val, record) => (
        <span style={{ fontWeight: record._type === 'parent' ? 700 : 400, color: record._type === 'parent' ? '#0f172a' : '#64748b' }}>
          {val}
        </span>
      ),
    },
    {
      key: 'noi_dung',
      label: 'Nội dung nhiệm vụ',
      required: true,
      title: 'Nội dung nhiệm vụ',
      dataIndex: 'noi_dung',
      width: 380,
      render: (text, record) => {
        if (record._type === 'parent') {
          const hasKids = record._childCount > 0
          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <ApartmentOutlined style={{ color: '#3b82f6', fontSize: '13px' }} />
                {hasKids && (
                  <span
                    onClick={() => toggleExpand(record._id)}
                    style={{ cursor: 'pointer', display: 'inline-flex', color: '#3b82f6' }}
                  >
                    {record._isExpanded ? <DownOutlined style={{ fontSize: '10px' }} /> : <RightOutlined style={{ fontSize: '10px' }} />}
                  </span>
                )}
                <Tag color="#3b82f6" style={{ borderRadius: '10px', fontWeight: 600, fontSize: '0.65rem', margin: 0, lineHeight: '18px' }}>
                  CV CHA
                </Tag>
                {hasKids && (
                  <Tag color="#8b5cf6" style={{ borderRadius: '10px', fontSize: '0.65rem', margin: 0, lineHeight: '18px' }}>
                    {record._childCount} cv con
                  </Tag>
                )}
              </div>
              <div style={{ fontWeight: 600, color: '#0f172a', lineHeight: 1.5, paddingLeft: '22px' }}>
                {text}
              </div>
            </div>
          )
        }
        // Child row
        return (
          <div style={{ paddingLeft: '28px', borderLeft: '3px solid #8b5cf6', marginLeft: '2px' }}>
            <span style={{ color: '#475569', fontSize: '0.9em' }}>{text}</span>
          </div>
        )
      },
    },
    {
      key: 'nguon',
      label: 'Nguồn',
      required: true,
      title: 'Nguồn',
      dataIndex: 'nguon',
      width: 130,
      render: (val, record) => {
        if (record._type === 'parent') return val
        return <Tag color="#3b82f6" style={{ borderRadius: '8px', fontSize: '0.75rem' }}>{val}</Tag>
      },
    },
    {
      key: 'van_ban_goc',
      label: 'Số văn bản gốc',
      title: 'Số văn bản gốc',
      dataIndex: 'van_ban_goc',
      width: 150,
      render: (text) => text || <span style={{ color: '#94a3b8' }}>—</span>,
    },
    {
      key: 'trang_thai',
      label: 'Trạng thái',
      required: true,
      title: 'Trạng thái',
      dataIndex: 'trang_thai',
      width: 140,
      align: 'center',
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
      key: 'linh_vuc',
      label: 'Lĩnh vực',
      title: 'Lĩnh vực',
      dataIndex: 'linh_vuc',
      width: 150,
      render: (text) => text || <span style={{ color: '#94a3b8' }}>—</span>,
    },
    {
      key: 'vai_tro_pvep',
      label: 'Vai trò PVEP',
      title: 'Vai trò PVEP',
      dataIndex: 'vai_tro_pvep',
      width: 130,
      render: (val) => {
        if (val === 'chu_tri') return 'PVEP chủ trì'
        if (val === 'phoi_hop') return 'PVEP phối hợp'
        return <span style={{ color: '#94a3b8' }}>—</span>
      },
    },
    {
      key: 'lanh_dao_chi_dao',
      label: 'Lãnh đạo chỉ đạo',
      title: 'Lãnh đạo chỉ đạo',
      dataIndex: 'lanh_dao_chi_dao',
      width: 160,
      render: (text) => text || <span style={{ color: '#94a3b8' }}>—</span>,
    },
    {
      key: 'don_vi_chu_tri',
      label: 'Đơn vị chủ trì',
      title: 'Đơn vị chủ trì',
      dataIndex: 'don_vi_chu_tri',
      width: 180,
      render: (text) => text
        ? <span title={text}>{text}</span>
        : <span style={{ color: '#94a3b8' }}>—</span>,
    },
    {
      key: 'thoi_han',
      label: 'Thời hạn',
      title: 'Thời hạn',
      dataIndex: 'thoi_han',
      width: 110,
      align: 'center',
      render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : <span style={{ color: '#94a3b8' }}>—</span>,
    },
    {
      key: 'ngay_duoc_giao',
      label: 'Ngày được giao',
      title: 'Ngày được giao',
      dataIndex: 'ngay_duoc_giao',
      width: 120,
      align: 'center',
      render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : <span style={{ color: '#94a3b8' }}>—</span>,
    },
    {
      key: 'muc_do',
      label: 'Mức độ',
      title: 'Mức độ',
      dataIndex: 'muc_do',
      width: 100,
      align: 'center',
      render: (val) => val
        ? <Tag color={mucDoColors[val]} style={{ borderRadius: '10px', fontWeight: 500 }}>{mucDoLabels[val]}</Tag>
        : '—',
    },
    {
      key: 'nhiem_vu_thuong_xuyen',
      label: 'Nhiệm vụ thường xuyên',
      title: 'Nhiệm vụ thường xuyên',
      dataIndex: 'nhiem_vu_thuong_xuyen',
      width: 150,
      align: 'center',
      render: (val) => val
        ? <Tag color="success" style={{ borderRadius: '10px' }}>Có</Tag>
        : <Tag color="default" style={{ borderRadius: '10px' }}>Không</Tag>,
    },
    {
      key: 'link_1office',
      label: 'Link 1Office',
      title: 'Link 1Office',
      dataIndex: 'link_1office',
      width: 160,
      render: (text) => text
        ? <a href={text} target="_blank" rel="noopener noreferrer" style={{ color: '#06b6d4' }}>Mở liên kết</a>
        : <span style={{ color: '#94a3b8' }}>—</span>,
    },
    {
      key: 'tinh_hinh',
      label: 'Tình hình thực hiện',
      title: 'Tình hình thực hiện',
      dataIndex: 'tinh_hinh',
      width: 450,
      render: (val, record) => {
        const baseStyle = { color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }
        if (record._type === 'parent') {
          if (!record.tinh_hinh_has_report) {
            return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa có báo cáo</span>
          }
          if (Array.isArray(val) && val.length > 0) {
            return (
              <div>
                {val.map((text, i) => (
                  <div key={i} style={{ ...baseStyle, marginBottom: i < val.length - 1 ? '8px' : 0 }}>
                    {text}
                  </div>
                ))}
              </div>
            )
          }
          return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa có báo cáo</span>
        }
        // Child row
        return val
          ? <span style={baseStyle}>{val}</span>
          : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa có</span>
      },
    },
    {
      key: 'ke_hoach',
      label: 'Kế hoạch tiếp theo',
      title: 'Kế hoạch tiếp theo',
      dataIndex: 'ke_hoach',
      width: 250,
      render: (val, record) => {
        if (record._type === 'parent') {
          if (!val || (Array.isArray(val) && val.length === 0)) {
            return <span style={{ color: '#94a3b8' }}>—</span>
          }
          return (
            <div>
              {val.map((text, i) => (
                <div key={i} style={{ marginBottom: i < val.length - 1 ? '4px' : 0, color: '#334155', fontSize: '0.85em' }}>
                  {text.length > 60 ? text.substring(0, 60) + '...' : text}
                </div>
              ))}
            </div>
          )
        }
        return val
          ? <span title={val} style={{ color: '#334155' }}>{val.length > 50 ? val.substring(0, 50) + '...' : val}</span>
          : <span style={{ color: '#94a3b8' }}>—</span>
      },
    },
    {
      key: 'de_xuat',
      label: 'Đề xuất / Kiến nghị',
      title: 'Đề xuất / Kiến nghị',
      dataIndex: 'de_xuat',
      width: 220,
      render: (val, record) => {
        if (record._type === 'parent') {
          if (!val || (Array.isArray(val) && val.length === 0)) {
            return <span style={{ color: '#94a3b8' }}>—</span>
          }
          return (
            <div>
              {val.map((text, i) => (
                <div key={i} style={{ marginBottom: i < val.length - 1 ? '4px' : 0, color: '#334155', fontSize: '0.85em' }}>
                  {text.length > 50 ? text.substring(0, 50) + '...' : text}
                </div>
              ))}
            </div>
          )
        }
        return val
          ? <span title={val} style={{ color: '#334155' }}>{val.length > 40 ? val.substring(0, 40) + '...' : val}</span>
          : <span style={{ color: '#94a3b8' }}>—</span>
      },
    },
    {
      key: 'hoan_thanh_thang',
      label: 'HT tháng',
      title: 'HT tháng',
      dataIndex: 'hoan_thanh_thang',
      width: 90,
      align: 'center',
      render: (val, record) => {
        const value = record._type === 'parent' ? record._hoan_thanh_thang : val
        return value
          ? <Tag color="success" style={{ borderRadius: '10px' }}>Có</Tag>
          : <Tag color="default" style={{ borderRadius: '10px' }}>Không</Tag>
      },
    },
    {
      key: 'ngay_hoan_thanh',
      label: 'Ngày hoàn thành',
      title: 'Ngày hoàn thành',
      dataIndex: 'ngay_hoan_thanh',
      width: 120,
      align: 'center',
      render: (val, record) => {
        const value = record._type === 'parent' ? record._ngay_hoan_thanh : val
        return value ? dayjs(value).format('DD/MM/YYYY') : <span style={{ color: '#94a3b8' }}>—</span>
      },
    },
    {
      key: 'van_ban_hoan_thanh',
      label: 'VB hoàn thành',
      title: 'VB hoàn thành',
      dataIndex: 'van_ban_hoan_thanh_so',
      width: 150,
      render: (text, record) => {
        const value = record._type === 'parent' ? record._van_ban_hoan_thanh_so : text
        const title = record._type === 'parent' ? record._van_ban_hoan_thanh_trich_yeu : record.van_ban_hoan_thanh_trich_yeu
        return value
          ? <span title={title || value}>{value}</span>
          : <span style={{ color: '#94a3b8' }}>—</span>
      },
    },
    {
      key: 'anh_huong_kh',
      label: 'Ảnh hưởng KH năm',
      title: 'Ảnh hưởng KH năm',
      dataIndex: 'anh_huong',
      width: 140,
      align: 'center',
      render: (val, record) => {
        const value = record._type === 'parent' && Array.isArray(val) ? val.find(Boolean) : val
        if (value === 'co') return <Tag color="warning" style={{ borderRadius: '10px' }}>Có</Tag>
        if (value === 'khong') return <Tag color="default" style={{ borderRadius: '10px' }}>Không</Tag>
        return <span style={{ color: '#94a3b8' }}>—</span>
      },
    },
    {
      key: 'danh_gia_nguyen_nhan_cham',
      label: 'Đánh giá nguyên nhân chậm tiến độ',
      title: 'Đánh giá nguyên nhân chậm tiến độ',
      dataIndex: 'danh_gia',
      width: 260,
      render: (val, record) => {
        const text = Array.isArray(val) ? val.filter(Boolean).join('\n') : val
        return text
          ? <span title={text} style={{ color: '#334155', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text.length > 80 ? text.substring(0, 80) + '...' : text}</span>
          : <span style={{ color: '#94a3b8' }}>—</span>
      },
    },
    {
      key: 'nguon_vb_hoan_thanh',
      label: 'Nguồn VB hoàn thành',
      title: 'Nguồn VB hoàn thành',
      dataIndex: 'van_ban_hoan_thanh_nguon',
      width: 160,
      render: (text, record) => {
        const value = record._type === 'parent' ? record._van_ban_hoan_thanh_nguon : text
        return value || <span style={{ color: '#94a3b8' }}>—</span>
      },
    },
    {
      key: 'trich_yeu_vb_hoan_thanh',
      label: 'Trích yếu VB hoàn thành',
      title: 'Trích yếu VB hoàn thành',
      dataIndex: 'van_ban_hoan_thanh_trich_yeu',
      width: 260,
      render: (text, record) => {
        const value = record._type === 'parent' ? record._van_ban_hoan_thanh_trich_yeu : text
        return value
          ? <span title={value} style={{ color: '#334155' }}>{value.length > 80 ? value.substring(0, 80) + '...' : value}</span>
          : <span style={{ color: '#94a3b8' }}>—</span>
      },
    },
    {
      key: 'actions',
      label: 'Thao tác',
      required: true,
      title: 'Thao tác',
      width: 120,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <div className="action-btn-group" style={{ justifyContent: 'center' }}>
          <button className="action-btn" title="Xem chi tiết"
            style={{ color: '#8b5cf6' }}
            onClick={() => handleViewDetail(record)}>
            <EyeOutlined />
          </button>
          <button className="action-btn action-btn-edit" title="Sửa công việc" onClick={() => handleEditTask(record)}>
            <EditOutlined />
          </button>
          <Popconfirm
            title="Xóa công việc?"
            description="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDeleteTask(record)}
            okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
          >
            <button className="action-btn action-btn-delete" title="Xóa công việc">
              <DeleteOutlined />
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ]

  const columnOptions = columns.map(col => ({
    label: col.label,
    value: col.key,
    disabled: col.required,
  }))
  const tableColumns = columns.filter(col => visibleColumnKeys.includes(col.key))
  const tableScrollX = Math.max(
    900,
    tableColumns.reduce((sum, col) => sum + (typeof col.width === 'number' ? col.width : 160), 0)
  )

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

  return (
    <div className="hungdv-page">
      <div className="hungdv-page-header">
        <div className="hungdv-page-title">
          <BarChartOutlined />
          <h1>Báo cáo tháng PVN</h1>
        </div>
      </div>

      {/* Period selector */}
      <div className="glass-card-static" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>Kỳ báo cáo:</span>
          <Select
            value={month}
            onChange={setMonth}
            options={monthOptions}
            style={{ width: 140, borderRadius: '12px' }}
          />
          <InputNumber
            value={year}
            onChange={setYear}
            min={2020}
            max={2030}
            style={{ width: 100 }}
            placeholder="Năm"
          />
          <button
            className="btn-glass-primary"
            onClick={handleExportExcel}
            style={{ fontSize: '0.8rem', height: '32px', background: 'linear-gradient(135deg, #10b981, #059669)', flexShrink: 0 }}
          >
            <DownloadOutlined /> Export Excel
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn-glass-primary" onClick={expandAll} style={{ fontSize: '0.8rem', height: '32px' }}>
            Mở rộng tất cả
          </button>
          <button className="btn-glass-primary" onClick={collapseAll} style={{ fontSize: '0.8rem', height: '32px' }}>
            Thu gọn tất cả
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '10px', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '10px' }}>
          <span style={{ fontWeight: 500, color: '#64748b', fontSize: '0.85rem', flexShrink: 0 }}>Cột hiển thị:</span>
          <Select
            mode="multiple"
            value={visibleColumnKeys}
            onChange={updateVisibleColumnKeys}
            options={columnOptions}
            placeholder="Chọn cột"
            maxTagCount="responsive"
            style={{ flex: 1, maxWidth: 600 }}
          />
          <button className="btn-glass-primary" onClick={showAllColumns} style={{ fontSize: '0.8rem', height: '32px' }}>
            Hiển thị tất cả
          </button>
        </div>
      </div>

      {/* Tabs: Dashboard + Report */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginBottom: '16px' }}
        items={[
          {
            key: 'dashboard',
            label: <span><DashboardOutlined /> Dashboard</span>,
            children: (
              <div>
                {dashboardLoading ? (
                  <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Đang tải dashboard...</div>
                ) : dashboardData ? (
                  <div>
                    {/* Row 1: Tổng quan */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                      {[
                        { label: 'Tổng công việc', value: dashboardData.kpi.totalAll, color: '#0f172a', icon: <BarChartOutlined /> },
                        { label: 'Công việc cha PVN', value: dashboardData.kpi.totalParents, color: '#3b82f6', icon: <ApartmentOutlined /> },
                        { label: 'Công việc phái sinh', value: dashboardData.kpi.totalChildren, color: '#8b5cf6', icon: <RightOutlined /> },
                      ].map((item, i) => (
                        <div key={i} className="glass-card-static" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: item.color, flexShrink: 0 }}>
                            {item.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: '28px', fontWeight: 700, color: item.color, lineHeight: 1 }}>{item.value}</div>
                            <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '2px' }}>{item.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Row 2: Trạng thái */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                      {[
                        { label: 'Đang triển khai', value: dashboardData.kpi.dangTrienKhai, color: '#3b82f6', icon: <RiseOutlined /> },
                        { label: 'Hoàn thành', value: dashboardData.kpi.hoanThanhTrongThang, color: '#10b981', icon: <CheckCircleOutlined /> },
                        { label: 'Quá hạn', value: dashboardData.kpi.quaHan, color: '#ef4444', icon: <WarningOutlined /> },
                      ].map((item, i) => (
                        <div key={i} className="glass-card-static" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: item.color, flexShrink: 0 }}>
                            {item.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: '28px', fontWeight: 700, color: item.color, lineHeight: 1 }}>{item.value}</div>
                            <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '2px' }}>{item.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Row 3: Kỳ hạn */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                      {[
                        { label: 'Đến hạn kỳ này', value: dashboardData.kpi.denHanKyNay, color: '#f59e0b', icon: <ClockCircleOutlined /> },
                        { label: 'Đến hạn kỳ sau', value: dashboardData.kpi.denHanKySau, color: '#8b5cf6', icon: <RightOutlined /> },
                        { label: 'Hoàn thành trong tháng', value: dashboardData.kpi.hoanThanhTrongThang, color: '#10b981', icon: <CheckCircleOutlined /> },
                      ].map((item, i) => (
                        <div key={i} className="glass-card-static" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: item.color, flexShrink: 0 }}>
                            {item.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: '28px', fontWeight: 700, color: item.color, lineHeight: 1 }}>{item.value}</div>
                            <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '2px' }}>{item.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Row 4: Khác */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                      {[
                        { label: 'Đã có báo cáo', value: dashboardData.kpi.coBaoCao, color: '#06b6d4', icon: <FileTextOutlined /> },
                        { label: 'Ảnh hưởng KH năm', value: dashboardData.kpi.anhHuongKH, color: '#f97316', icon: <WarningOutlined /> },
                      ].map((item, i) => (
                        <div key={i} className="glass-card-static" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: item.color, flexShrink: 0 }}>
                            {item.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: '28px', fontWeight: 700, color: item.color, lineHeight: 1 }}>{item.value}</div>
                            <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '2px' }}>{item.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Summary Tables */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      {/* By Leader */}
                      <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <TeamOutlined /> Theo Lãnh đạo chỉ đạo
                        </div>
                        <Table
                          dataSource={dashboardData.byLeader}
                          rowKey="name"
                          size="small"
                          pagination={false}
                          bordered
                          columns={[
                            { title: 'Lãnh đạo', dataIndex: 'name', width: 160, render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
                            { title: 'Tổng', dataIndex: 'total', width: 60, align: 'center' },
                            { title: 'Đang triển khai', dataIndex: 'dang_tri', width: 80, align: 'center', render: (v) => <span style={{ color: v > 0 ? '#3b82f6' : '#94a3b8' }}>{v}</span> },
                            { title: 'Quá hạn', dataIndex: 'qua_han', width: 60, align: 'center', render: (v) => <span style={{ color: v > 0 ? '#ef4444' : '#94a3b8', fontWeight: v > 0 ? 600 : 400 }}>{v}</span> },
                            { title: 'Hoàn thành', dataIndex: 'hoan_thanh', width: 80, align: 'center', render: (v) => <span style={{ color: v > 0 ? '#10b981' : '#94a3b8' }}>{v}</span> },
                            { title: 'ĐH kỳ này', dataIndex: 'den_han_nay', width: 70, align: 'center', render: (v) => <span style={{ color: v > 0 ? '#f59e0b' : '#94a3b8' }}>{v}</span> },
                            { title: 'ĐH kỳ sau', dataIndex: 'den_han_sau', width: 70, align: 'center', render: (v) => <span style={{ color: v > 0 ? '#8b5cf6' : '#94a3b8' }}>{v}</span> },
                          ]}
                          scroll={{ x: 520 }}
                        />
                      </div>

                      {/* By Unit */}
                      <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <BankOutlined /> Theo Đơn vị chủ trì
                        </div>
                        <Table
                          dataSource={dashboardData.byUnit}
                          rowKey="name"
                          size="small"
                          pagination={false}
                          bordered
                          columns={[
                            { title: 'Đơn vị', dataIndex: 'name', width: 160, render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
                            { title: 'Tổng', dataIndex: 'total', width: 60, align: 'center' },
                            { title: 'Đang triển khai', dataIndex: 'dang_tri', width: 80, align: 'center', render: (v) => <span style={{ color: v > 0 ? '#3b82f6' : '#94a3b8' }}>{v}</span> },
                            { title: 'Quá hạn', dataIndex: 'qua_han', width: 60, align: 'center', render: (v) => <span style={{ color: v > 0 ? '#ef4444' : '#94a3b8', fontWeight: v > 0 ? 600 : 400 }}>{v}</span> },
                            { title: 'Hoàn thành', dataIndex: 'hoan_thanh', width: 80, align: 'center', render: (v) => <span style={{ color: v > 0 ? '#10b981' : '#94a3b8' }}>{v}</span> },
                            { title: 'ĐH kỳ này', dataIndex: 'den_han_nay', width: 70, align: 'center', render: (v) => <span style={{ color: v > 0 ? '#f59e0b' : '#94a3b8' }}>{v}</span> },
                            { title: 'ĐH kỳ sau', dataIndex: 'den_han_sau', width: 70, align: 'center', render: (v) => <span style={{ color: v > 0 ? '#8b5cf6' : '#94a3b8' }}>{v}</span> },
                          ]}
                          scroll={{ x: 520 }}
                        />
                      </div>
                    </div>

                    {/* By Field + By Importance */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                      <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', fontWeight: 600, color: '#0f172a' }}>
                          Theo Lĩnh vực
                        </div>
                        <Table
                          dataSource={dashboardData.byField}
                          rowKey="name"
                          size="small"
                          pagination={false}
                          bordered
                          columns={[
                            { title: 'Lĩnh vực', dataIndex: 'name', width: 200 },
                            { title: 'Tổng', dataIndex: 'total', width: 60, align: 'center' },
                            { title: 'Đang triển khai', dataIndex: 'dang_tri', width: 80, align: 'center', render: (v) => <span style={{ color: v > 0 ? '#3b82f6' : '#94a3b8' }}>{v}</span> },
                            { title: 'Quá hạn', dataIndex: 'qua_han', width: 60, align: 'center', render: (v) => <span style={{ color: v > 0 ? '#ef4444' : '#94a3b8', fontWeight: v > 0 ? 600 : 400 }}>{v}</span> },
                            { title: 'Hoàn thành', dataIndex: 'hoan_thanh', width: 80, align: 'center', render: (v) => <span style={{ color: v > 0 ? '#10b981' : '#94a3b8' }}>{v}</span> },
                          ]}
                        />
                      </div>

                      <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', fontWeight: 600, color: '#0f172a' }}>
                          Theo Mức độ quan trọng
                        </div>
                        <Table
                          dataSource={dashboardData.byMucDo}
                          rowKey="name"
                          size="small"
                          pagination={false}
                          bordered
                          columns={[
                            { title: 'Mức độ', dataIndex: 'name', width: 140, render: (v) => {
                              const labels = { cao: 'Cao', trung_binh: 'Trung bình', thap: 'Thấp', chua_phan_loai: 'Chưa phân loại' }
                              const colors = { cao: '#ef4444', trung_binh: '#3b82f6', thap: '#64748b', chua_phan_loai: '#94a3b8' }
                              return <Tag color={colors[v] || '#94a3b8'} style={{ borderRadius: '10px' }}>{labels[v] || v}</Tag>
                            }},
                            { title: 'Tổng', dataIndex: 'total', width: 60, align: 'center' },
                            { title: 'Đang triển khai', dataIndex: 'dang_tri', width: 80, align: 'center', render: (v) => <span style={{ color: v > 0 ? '#3b82f6' : '#94a3b8' }}>{v}</span> },
                            { title: 'Quá hạn', dataIndex: 'qua_han', width: 60, align: 'center', render: (v) => <span style={{ color: v > 0 ? '#ef4444' : '#94a3b8', fontWeight: v > 0 ? 600 : 400 }}>{v}</span> },
                            { title: 'Hoàn thành', dataIndex: 'hoan_thanh', width: 80, align: 'center', render: (v) => <span style={{ color: v > 0 ? '#10b981' : '#94a3b8' }}>{v}</span> },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Không có dữ liệu</div>
                )}
              </div>
            ),
          },
          {
            key: 'report',
            label: <span><BarChartOutlined /> Báo cáo chi tiết</span>,
            children: (
              <div>
                {/* Report table */}
                <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>
                      Báo cáo tháng {month}/{year} — {totalParents} công việc cha, {totalChildren} công việc phái sinh
                    </span>
                  </div>
                  <div className="glass-table-wrap">
                    <Table
                      columns={tableColumns}
                      dataSource={tableData}
                      rowKey="_key"
                      loading={loading}
                      pagination={false}
                      bordered
                      size="small"
                      scroll={{ x: tableScrollX }}
                      rowClassName={(record) => record._type === 'parent' ? 'row-parent-pvn' : 'row-child-pvn'}
                      locale={{ emptyText: 'Không có dữ liệu cho kỳ báo cáo này' }}
                    />
                  </div>
                </div>
              </div>
            ),
          },
        ]}
      />

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
            <Descriptions column={2} bordered size="small">
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
                <Tag color={taskSourceColors[detailTask.nguon_nhiem_vu] || '#64748b'} style={{ borderRadius: '10px' }}>
                  {detailTask.nguon_nhiem_vu}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Mức độ">
                {detailTask.muc_do_quan_trong
                  ? <Tag color={mucDoColors[detailTask.muc_do_quan_trong]} style={{ borderRadius: '10px' }}>{mucDoLabels[detailTask.muc_do_quan_trong]}</Tag>
                  : '—'}
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
              <Descriptions.Item label="Văn bản gốc" span={2}>
                {detailTask.van_ban_so ? `${detailTask.van_ban_so} (${detailTask.van_ban_nguon || ''})` : '—'}
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
                      render: (v) => <Tag color={taskSourceColors[v] || '#64748b'} style={{ borderRadius: '8px' }}>{v}</Tag> },
                  ]}
                  style={{ marginBottom: '16px' }}
                />
              </>
            )}

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

              <Form.Item
                name="anh_huong_kh"
                label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Ảnh hưởng đến KH năm</span>}
              >
                <Select options={[{ label: 'Có', value: 'co' }, { label: 'Không', value: 'khong' }]} />
              </Form.Item>

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

      <Modal
        title="Sửa công việc"
        open={taskModalVisible}
        onCancel={() => { setTaskModalVisible(false); taskForm.resetFields(); setEditingTask(null) }}
        onOk={handleTaskSubmit}
        confirmLoading={taskSubmitting}
        okText="Cập nhật"
        cancelText="Hủy"
        className="hungdv-modal"
        width={780}
        destroyOnClose
      >
        <Form form={taskForm} layout="vertical" style={{ marginTop: '16px' }}>
          <Form.Item name="loai_xu_ly" label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Loại xử lý</span>}
            rules={[{ required: true, message: 'Vui lòng chọn loại xử lý' }]}>
            <Select options={loaiXuLyOptions} placeholder="Chọn loại xử lý" />
          </Form.Item>

          <Form.Item name="cv_lien_ket_id" hidden><Input /></Form.Item>

          {selectedLoaiXuLy === 'tao_phai_sinh' && (
            <Form.Item name="parent_id" label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Công việc cha (Petrovietnam)</span>}
              rules={[{ required: true, message: 'Vui lòng chọn công việc cha' }]}>
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

          {selectedLoaiXuLy !== 'theo_doi' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item name="van_ban_goc_id" label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Văn bản gốc</span>}
                  rules={[{ required: true, message: 'Vui lòng chọn văn bản gốc' }]}>
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

                <Form.Item name="nguon_nhiem_vu" label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Nguồn nhiệm vụ</span>}
                  rules={[{ required: true, message: 'Nguồn nhiệm vụ được lấy từ văn bản gốc' }]}>
                  <Select options={taskSourceOptions} placeholder="Tự lấy từ văn bản gốc" disabled />
                </Form.Item>
              </div>

              <Form.Item name="linh_vuc_id" label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Lĩnh vực</span>}
                rules={[{ required: true, message: 'Vui lòng chọn lĩnh vực' }]}>
                <Select options={linhVucOptions} placeholder="Chọn lĩnh vực" disabled={selectedLoaiXuLy === 'tao_phai_sinh'} />
              </Form.Item>

              <Form.Item name="noi_dung_nhiem_vu" label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Nội dung nhiệm vụ</span>}
                rules={[{ required: true, message: 'Vui lòng nhập nội dung nhiệm vụ' }]}>
                <Input.TextArea placeholder="Mô tả công việc cần thực hiện" rows={3} />
              </Form.Item>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item name="muc_do_quan_trong" label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Mức độ quan trọng</span>}>
                  <Select options={mucDoOptions} placeholder="Chọn mức độ" allowClear />
                </Form.Item>
                <Form.Item name="vai_tro_pvep" label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Vai trò PVEP</span>}>
                  <Select options={vaiTroOptions} placeholder="Chọn vai trò" allowClear />
                </Form.Item>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item name="lanh_dao_pvep_ids" label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Lãnh đạo PVEP chỉ đạo</span>}>
                  <Select
                    mode="multiple"
                    options={lanhDaoOptions}
                    placeholder="Chọn lãnh đạo"
                    allowClear
                    maxTagCount={2}
                  />
                </Form.Item>
                <Form.Item name="don_vi_chu_tri_ids" label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Ban, Đơn vị chủ trì</span>}>
                  <Select mode="multiple" options={donViOptions} placeholder="Chọn ban/đơn vị" allowClear maxTagCount={2} />
                </Form.Item>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item name="ngay_duoc_giao" label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Ngày được giao</span>}
                  rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}>
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
                </Form.Item>
                <Form.Item name="thoi_han_hoan_thanh" label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Thời hạn hoàn thành</span>}
                  rules={[{
                    validator: (_, value) => {
                      if (!value) return Promise.resolve()
                      const parent = pvTasks.find(t => t.id === selectedParentId)
                      if (parent && parent.thoi_han_hoan_thanh) {
                        const parentDeadline = dayjs(parent.thoi_han_hoan_thanh)
                        if (value.isAfter(parentDeadline, 'day')) {
                          return Promise.reject(new Error(`Thời hạn phải ≤ thời hạn công việc cha (${parentDeadline.format('DD/MM/YYYY')})`))
                        }
                      }
                      return Promise.resolve()
                    }
                  }]}>
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn thời hạn" />
                </Form.Item>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item name="nhiem_vu_thuong_xuyen" valuePropName="checked">
                  <Checkbox>Nhiệm vụ thường xuyên</Checkbox>
                </Form.Item>
                <Form.Item name="link_1office" label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Link 1Office</span>}>
                  <Input placeholder="https://..." prefix={<LinkOutlined style={{ color: '#94a3b8' }} />} />
                </Form.Item>
              </div>
            </>
          )}

          {selectedLoaiXuLy === 'theo_doi' && (
            <Form.Item name="noi_dung_nhiem_vu" label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Nội dung công việc</span>}
              rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}>
              <Input.TextArea placeholder="Mô tả công việc cần theo dõi" rows={3} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}
