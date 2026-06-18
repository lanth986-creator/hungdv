import { useState, useEffect, useCallback } from 'react'
import { Modal, Form, Input, InputNumber, Select, Switch, Button, message, Popconfirm } from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined,
  SearchOutlined, FolderOutlined, FolderOpenOutlined,
} from '@ant-design/icons'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categoryApi'

const colorOptions = [
  { label: 'Cyan', value: '#06b6d4' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Gray', value: '#64748b' },
]

export default function CategoryPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedParent, setSelectedParent] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [modalType, setModalType] = useState('child') // 'parent' or 'child'
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCategories()
      setCategories(res.data || [])
    } catch (err) {
      message.error(err.message || 'Lỗi tải danh mục')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Phan loai
  const parents = categories.filter(c => !c.parent_id)
  const children = selectedParent
    ? categories.filter(c => c.parent_id === selectedParent.id)
    : []

  const getChildCount = (parentId) => categories.filter(c => c.parent_id === parentId).length

  // === Handlers ===
  const handleCreateParent = () => {
    setEditingCategory(null)
    setModalType('parent')
    form.resetFields()
    form.setFieldsValue({ color: '#06b6d4', sort_order: 0, is_active: true })
    setModalVisible(true)
  }

  const handleCreateChild = () => {
    setEditingCategory(null)
    setModalType('child')
    form.resetFields()
    form.setFieldsValue({
      color: selectedParent?.color || '#06b6d4',
      parent_id: selectedParent?.id,
      sort_order: 0,
      is_active: true,
    })
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingCategory(record)
    setModalType(record.parent_id ? 'child' : 'parent')
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      color: record.color || '#06b6d4',
      parent_id: record.parent_id,
      sort_order: record.sort_order || 0,
      is_active: record.is_active,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await deleteCategory(id)
      message.success('Xóa thành công')
      if (selectedParent && id === selectedParent.id) {
        setSelectedParent(null)
      }
      fetchCategories()
    } catch (err) {
      message.error(err.message || 'Lỗi xóa')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      if (editingCategory) {
        await updateCategory(editingCategory.id, values)
        message.success('Cập nhật thành công')
      } else {
        await createCategory(values)
        message.success('Tạo mới thành công')
      }
      setModalVisible(false)
      fetchCategories()
    } catch (err) {
      if (err.errorFields) return
      message.error(err.message || 'Lỗi lưu')
    } finally {
      setSubmitting(false)
    }
  }

  // Parent options for child form
  const parentOptions = categories
    .filter(c => !c.parent_id)
    .map(c => ({ label: c.name, value: c.id }))

  return (
    <div className="hungdv-page">
      {/* Header */}
      <div className="hungdv-page-header">
        <div className="hungdv-page-title">
          <AppstoreOutlined />
          <h1>Quản lý Danh mục</h1>
        </div>
      </div>

      {/* Two Panel Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* ===== LEFT: Danh mục cha ===== */}
        <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderOutlined style={{ color: '#06b6d4', fontSize: '16px' }} />
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Danh mục cha</span>
              <span style={{
                background: 'rgba(6,182,212,0.1)', color: '#06b6d4',
                padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600,
              }}>{parents.length}</span>
            </div>
            <button className="btn-glass-primary" style={{ height: '32px', padding: '0 12px', fontSize: '0.8rem' }} onClick={handleCreateParent}>
              <PlusOutlined /> Thêm
            </button>
          </div>

          <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            {parents.map(parent => {
              const isActive = selectedParent?.id === parent.id
              const childCount = getChildCount(parent.id)
              return (
                <div
                  key={parent.id}
                  onClick={() => setSelectedParent(parent)}
                  style={{
                    padding: '14px 20px',
                    cursor: 'pointer',
                    borderLeft: isActive ? `3px solid ${parent.color || '#06b6d4'}` : '3px solid transparent',
                    background: isActive ? 'rgba(6,182,212,0.06)' : 'transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.3)',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    <span className="color-dot" style={{ background: parent.color || '#06b6d4', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontWeight: isActive ? 700 : 600,
                        color: isActive ? '#0f172a' : '#1e293b',
                        fontSize: '0.9rem',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{parent.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                        {childCount} danh mục con
                      </div>
                    </div>
                  </div>
                  <div className="action-btn-group" style={{ flexShrink: 0 }}>
                    <button className="action-btn action-btn-edit" onClick={(e) => { e.stopPropagation(); handleEdit(parent) }}>
                      <EditOutlined />
                    </button>
                    <Popconfirm
                      title="Xóa danh mục cha?"
                      description="Tất cả danh mục con cũng sẽ bị xóa"
                      onConfirm={(e) => { e.stopPropagation(); handleDelete(parent.id) }}
                      okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
                    >
                      <button className="action-btn action-btn-delete" onClick={(e) => e.stopPropagation()}>
                        <DeleteOutlined />
                      </button>
                    </Popconfirm>
                  </div>
                </div>
              )
            })}
            {parents.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                Chưa có danh mục cha nào
              </div>
            )}
          </div>
        </div>

        {/* ===== RIGHT: Danh mục con ===== */}
        <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
          {selectedParent ? (
            <>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FolderOpenOutlined style={{ color: selectedParent.color || '#06b6d4', fontSize: '16px' }} />
                  <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{selectedParent.name}</span>
                  <span style={{
                    background: `${selectedParent.color}15`, color: selectedParent.color,
                    padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600,
                  }}>{children.length} mục</span>
                </div>
                <button className="btn-glass-primary" style={{ height: '32px', padding: '0 12px', fontSize: '0.8rem' }} onClick={handleCreateChild}>
                  <PlusOutlined /> Thêm con
                </button>
              </div>

              <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                {children.map((child, idx) => (
                  <div key={child.id} style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'background 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      <span style={{
                        width: '24px', height: '24px', borderRadius: '8px',
                        background: `${selectedParent.color}12`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, color: selectedParent.color,
                        flexShrink: 0,
                      }}>{idx + 1}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontWeight: 600, color: '#1e293b', fontSize: '0.88rem',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{child.name}</div>
                        {child.description && (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '1px',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {child.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="action-btn-group" style={{ flexShrink: 0 }}>
                      <button className="action-btn action-btn-edit" onClick={() => handleEdit(child)}>
                        <EditOutlined />
                      </button>
                      <Popconfirm
                        title="Xóa danh mục con?"
                        onConfirm={() => handleDelete(child.id)}
                        okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
                      >
                        <button className="action-btn action-btn-delete">
                          <DeleteOutlined />
                        </button>
                      </Popconfirm>
                    </div>
                  </div>
                ))}
                {children.length === 0 && (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    Chưa có danh mục con. Nhấn "Thêm con" để tạo.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: '80px 40px', textAlign: 'center' }}>
              <AppstoreOutlined style={{ fontSize: '48px', color: 'rgba(148,163,184,0.3)', marginBottom: '16px' }} />
              <div style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                Chọn danh mục cha bên trái để xem danh mục con
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Modal ===== */}
      <Modal
        title={editingCategory ? 'Sửa danh mục' : (modalType === 'parent' ? 'Thêm danh mục cha' : 'Thêm danh mục con')}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingCategory ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        className="hungdv-modal"
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: '16px' }}>
          <Form.Item
            name="name"
            label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Tên danh mục</span>}
            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
          >
            <Input placeholder="Nhập tên danh mục" />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Mô tả</span>}
          >
            <Input.TextArea placeholder="Mô tả (tùy chọn)" rows={2} />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="color"
              label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Màu sắc</span>}
            >
              <Select options={colorOptions} placeholder="Chọn màu" />
            </Form.Item>

            {modalType === 'child' && (
              <Form.Item
                name="parent_id"
                label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Danh mục cha</span>}
              >
                <Select options={parentOptions} placeholder="Chọn cha" />
              </Form.Item>
            )}

            {modalType === 'parent' && (
              <Form.Item
                name="sort_order"
                label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Thứ tự</span>}
              >
                <InputNumber min={0} max={999} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            )}
          </div>

          {modalType === 'child' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Form.Item
                name="sort_order"
                label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Thứ tự</span>}
              >
                <InputNumber min={0} max={999} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
              <Form.Item
                name="is_active"
                label={<span style={{ fontWeight: 600, color: '#0f172a' }}>Trạng thái</span>}
                valuePropName="checked"
              >
                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" className="glass-switch" />
              </Form.Item>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  )
}
