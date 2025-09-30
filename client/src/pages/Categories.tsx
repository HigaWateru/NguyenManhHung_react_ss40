import { useEffect, useMemo, useState } from "react"
import { Button, Form, Input, Modal, Select, Table, Tag } from "antd"
import type { ColumnsType } from "antd/es/table"
import axios from "axios"
import type { CategoryRow, CategoryStatus } from "../utils/type"

export default function Categories() {
  const [rows, setRows] = useState<CategoryRow[]>([])
  const [loadingItem, setLoadingItem] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryRow | null>(null)
  const [search, setSearch] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("all")


  const [form] = Form.useForm()

  useEffect(() => {
    axios.get("http://localhost:8080/categories").then(res => setRows(res.data))
  }, [])

  const columns: ColumnsType<CategoryRow> = [
    { title: "Tên", dataIndex: "name" },
    { title: "Mô tả", dataIndex: "description" },
    { title: "Trạng thái", dataIndex: "status", 
      render: (status: CategoryStatus) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Hoạt động' : 'Ngừng'}
        </Tag>
      )
    },
    { title: "Thao tác",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button size="small" type="primary" onClick={() => onEdit(record)}>Sửa</Button>
          <Button size="small" danger onClick={() => onDelete(record.id)}>Xóa</Button>
        </div>
      )
    }
  ]

  const filtered = useMemo(() => {
    return rows.filter((r) => search ? (r.name + r.code).toLowerCase().includes(search.toLowerCase()) : true).filter((r) => statusFilter && statusFilter !== "all" ? r.status === statusFilter : true)
  }, [rows, search, statusFilter])
  

  function onAdd() {
    setEditing(null)
    form.resetFields() 
    form.setFieldsValue({ status: "active" })
    setOpen(true)
  }

  function onEdit(row: CategoryRow) {
    setEditing(row)
    form.setFieldsValue(row)
    setOpen(true)
  }

  async function onDelete(id: string) {
    await axios.delete(`http://localhost:8080/categories/${id}`)
    setRows(prev => prev.filter(r => r.id !== id))
  }

  async function onSubmit(values: Omit<CategoryRow, "id">) {
    try {
      setLoadingItem(true)
      if (editing) {
        const updated = { ...editing, ...values }
        await axios.put(`http://localhost:8080/categories/${editing.id}`, updated)
        setRows(prev => prev.map(r => r.id === editing.id ? updated : r))
      } else {
        const res = await axios.post("http://localhost:8080/categories", values)
        setRows(prev => [...prev, res.data])
      }
      setOpen(false)
    } catch(error) {
      console.log('Error: ', error)
    } finally {
      setLoadingItem(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-semibold">Quản lý danh mục</h2>
        <Button type="primary" onClick={onAdd}>Thêm mới</Button>
      </div>

      <div className="flex justify-end gap-3 mb-4">
        <Select placeholder="Trạng thái" style={{ width: "200px" }} allowClear value={statusFilter} onChange={setStatusFilter}
          options={[
            { value: "all", label: "Tất cả" },
            { value: "active", label: "Hoạt động" },
            { value: "inactive", label: "Ngừng" },
          ]}
        />
        <Input placeholder="Tìm kiếm" style={{ width: "300px" }} value={search} onChange={e => setSearch(e.target.value)}/>
      </div>

      <Table columns={columns} dataSource={filtered} rowKey="id" />

      <Modal open={open} title={editing ? "Sửa danh mục" : "Thêm danh mục"} onCancel={() => setOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item name="name" label="Tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
            <Select 
              options={[
                { value: "active", label: "Hoạt động" }, 
                { value: "inactive", label: "Ngừng" }
              ]} 
            />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loadingItem}>Lưu</Button>
        </Form>
      </Modal>
    </div>
  )
}
