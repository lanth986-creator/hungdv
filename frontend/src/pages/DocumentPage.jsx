import { useState, useEffect, useCallback } from 'react'
import { Modal, Form, Input, Select, DatePicker, Upload, Table, Tag, message, Popconfirm } from 'antd'
import {
  FileTextOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, DownloadOutlined, PaperClipOutlined,
} from '@ant-design/icons'
import { getDocuments, createDocument, updateDocument, deleteDocument, getDocumentSources } from '../api/documentApi'
import dayjs from 'dayjs'

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

export default function DocumentPage() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')
  const [filterSource, setFilterSource] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingDoc, setEditingDoc] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [fileList, setFileList] = useState([])
  const [form] = Form.useForm()

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getDocuments({ search, nguon_van_ban: filterSource, page, limit })
      setDocuments(res.data || [])
      setTotal(res.total || 0)
    } catch (err) {
      message.error(err.message || 'Lỗi tải văn bản')
    } finally {
      setLoading(false)
    }
  }, [search, filterSource, page, limit])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleCreate = () => {
    setEditingDoc(null)
    form.resetFields()
    setFileList([])
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingDoc(record)
    form.setFieldsValue({
      so_van_ban: record.so_van_ban,
      ngay: record.ngay ? dayjs(record.ngay) : null,
      nguon_van_ban: record.nguon_van_ban,
      trich_yeu: record.trich_yeu,
      ghi_chu: record.ghi_chu,
    })
    if (record.file_name) {
      setFileList([{
        uid: '-1',
        name: record.file_name,
        status: 'done',
      }])
    } else {
      setFileList([])
    }
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await deleteDocument(id)
      message.success('Xóa thành công')
      fetchDocuments()
    } catch (err) {
      message.error(err.message || 'Lỗi xóa')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const formData = new FormData()
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && values[key] !== null) {
          if (key === 'ngay') {
            formData.append(key, values[key].format('YYYY-MM-DD'))
          } else {
            formData.append(key, values[key])
          }
        }
      })
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('file', fileList[0].originFileObj)
      }
      if (editingDoc) {
        await updateDocument(editingDoc.id, formData)
        message.success('Cập nhật thành công')
      } else {
        await createDocument(formData)
        message.success('Tạo mới thành công')
      }
      setModalVisible(false)
      setFileList([])
      fetchDocuments()
    } catch (err) {
      if (err.errorFields) return
      message.error(err.message || 'Lỗi lưu')
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      title: 'STT',
      width: 60,
      align: 'center',
      render: (_, __, index) => (page - 1) * limit + index + 1,
    },
    {
      title: 'Số văn bản',
      dataIndex: 'so_van_ban',
      key: 'so_van_ban',
      width: 150,
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>,
    },
    {
      title: 'Ngày',
      dataIndex: 'ngay',
      key: 'ngay',
      width: 120,
      render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '',
    },
    {
      title: 'Nguồn văn bản',
      dataIndex: 'nguon_van_ban',
      key: 'nguon_van_ban',
      width: 150,
      render: (text) => (
        <Tag color={sourceColors[text] || '#64748b'} style={{ borderRadius: '10px', fontWeight: 500 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: 'Trích yếu',
      dataIndex: 'trich_yeu',
      key: 'trich_yeu',
      ellipsis: true,
      render: (text) => (
        <span style={{ color: '#1e293b' }} title={text}>
          {text && text.length > 80 ? text.substring(0, 80) + '...' : text}
        </span>
      ),
    },
    {
      title: 'File',
      dataIndex: 'file_name',
      key: 'file_name',
      width: 120,
      align: 'center',
      render: (name, record) => name ? (
        <a href={record.file_path} target="_blank" rel="noopener noreferrer"
          style={{ color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <DownloadOutlined /> Tải
        </a>
      ) : <span style={{ color: '#94a3b8' }}>—</span>,
    },
    {
      title: 'Thao tác',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <div className="action-btn-group" style={{ justifyContent: 'center' }}>
          <button className="action-btn action-btn-edit" onClick={() => handleEdit(record)}>
            <EditOutlined />
          </button>
          <Popconfirm
            title="Xóa văn bản?"
            description="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.id)}
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
      {/* Header */}
      <div className="hungdv-page-header">
        <div className="hungdv-page-title">
          <FileTextOutlined />
          <h1>Quản lý Văn bản</h1>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="glass-card-static" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Input
            placeholder="Tìm theo số văn bản, trích yếu..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            style={{ width: 320, borderRadius: '12px' }}
            allowClear
          />
          <Select
            placeholder="Nguồn văn bản"
            value={filterSource}
            onChange={(val) => { setFilterSource(val); setPage(1) }}
            options={sourceOptions}
            style={{ width: 200, borderRadius: '12px' }}
            allowClear
          />
          <div style={{ flex: 1 }} />
          <button className="btn-glass-primary" onClick={handleCreate}>
            <PlusOutlined /> Thêm mới
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="glass-table-wrap">
          <Table
            columns={columns}
            dataSource={documents}
            rowKey="id"
            loading={loading}
            pagination={{
              current: page,
              pageSize: limit,
              total,
              onChange: (p) => setPage(p),
              showSizeChanger: false,
              showTotal: (t) => `Tổng: ${t} văn bản`,
            }}
          />
        </div>
      </div>

      {/* Modal */}
      <Modal
        title={editingDoc ? 'Sửa văn bản' : 'Thêm văn bản mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingDoc ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        className="hungdv-modal"
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="so_van_ban"
              label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Số văn bản</span>}
              rules={[{ required: true, message: 'Vui lòng nhập số văn bản' }]}
            >
              <Input placeholder="VD: 1234/HĐTV-PVEP" />
            </Form.Item>

            <Form.Item
              name="ngay"
              label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Ngày ban hành</span>}
              rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
            </Form.Item>
          </div>

          <Form.Item
            name="nguon_van_ban"
            label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Nguồn văn bản</span>}
            rules={[{ required: true, message: 'Vui lòng chọn nguồn văn bản' }]}
          >
            <Select options={sourceOptions} placeholder="Chọn nguồn văn bản" />
          </Form.Item>

          <Form.Item
            name="trich_yeu"
            label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Trích yếu</span>}
            rules={[{ required: true, message: 'Vui lòng nhập trích yếu' }]}
          >
            <Input.TextArea placeholder="Tóm tắt nội dung văn bản" rows={3} />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#0f172a' }}>File đính kèm</span>}
          >
            <Upload
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: newList }) => setFileList(newList.slice(-1))}
              maxCount={1}
            >
              {fileList.length === 0 && (
                <div style={{
                  border: '1px dashed rgba(148,163,184,0.5)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}>
                  <PaperClipOutlined style={{ fontSize: '24px', color: '#8b5cf6', marginBottom: '8px' }} />
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Nhấn để chọn file (PDF, Word, Excel, ảnh...)</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item
            name="ghi_chu"
            label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Ghi chú</span>}
          >
            <Input.TextArea placeholder="Ghi chú (tùy chọn)" rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
