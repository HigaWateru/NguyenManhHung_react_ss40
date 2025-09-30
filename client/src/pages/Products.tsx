import { useEffect, useMemo, useState } from "react"
import { Button, Form, Input, Modal, Select, Table, Image, Upload, Tag } from "antd"
import type { ColumnsType } from "antd/es/table"
import axios from "axios"
import type { ProductRow, CategoryRow, ProductStatus } from "../utils/type"
import { uploadImg } from "../apis/upload.api"
import { UploadOutlined } from "@ant-design/icons"

export default function Products() {
  const [rows, setRows] = useState<ProductRow[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ProductRow | null>(null)
  const [loadingItem, setLoadingItem] = useState<boolean>(false)
  const [search, setSearch] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const [form] = Form.useForm()

  useEffect(() => {
    axios.get("http://localhost:8080/products?_expand=category").then(res => setRows(res.data))
    axios.get("http://localhost:8080/categories").then(res => setCategories(res.data))
  }, [])

  const filtered = useMemo(() => {
    return rows.filter((r) => search ? (r.name + r.code).toLowerCase().includes(search.toLowerCase()) : true).filter((r) =>statusFilter && statusFilter !== "all" ? r.status === statusFilter : true)
  }, [rows, search, statusFilter])


  const columns: ColumnsType<ProductRow> = [
    { title: "Mã", dataIndex: "code" },
    { title: "Tên", dataIndex: "name" },
    { title: "Danh mục", dataIndex: "categoryId", render: (id: string) => categories.find(c => c.id === id)?.name ?? "-" },
    { title: "Giá", dataIndex: "price", render: (v: number) => v.toLocaleString() + " đ" },
    { title: "Ảnh", dataIndex: "image", render: (src: string) => <Image src={src} width={56} /> },
    { title: "Trạng thái", dataIndex: "status", 
      render: (status: ProductStatus) => (
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

  function onAdd() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ status: "active" }) 
    setOpen(true)
  }

  function onEdit(row: ProductRow) {
    setEditing(row)
    setOpen(true)
    form.setFieldsValue(row)
  }

  async function onDelete(id: string) {
    await axios.delete(`http://localhost:8080/products/${id}`)
    setRows(prev => prev.filter(r => r.id !== id))
  }

  async function onSubmit(values: any) {
    try {
      let imageUrl = values.image
      if (values.image?.file) imageUrl = await uploadImg(values.image.file)

      const product: ProductRow = {
        id: editing?.id ?? String(Date.now()),
        code: values.code,
        name: values.name,
        categoryId: values.categoryId,
        price: Number(values.price),
        image: imageUrl,
        status: values.status
      }

      if (editing) {
        await axios.put(`http://localhost:8080/products/${editing.id}`, product)
        setRows(prev => prev.map(r => r.id === editing.id ? product : r))
      } else {
        const res = await axios.post("http://localhost:8080/products", product)
        setRows(prev => [...prev, res.data])
      }
      setOpen(false)
    } catch(error) {
      console.log('Error', error)
    } finally {
      setLoadingItem(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-semibold">Quản lý sản phẩm</h2>
        <Button type="primary" onClick={onAdd}>Thêm mới</Button>
      </div>
      <div className="flex justify-end gap-3 mb-4">
        <Select placeholder="Trạng thái" className="min-w-40" allowClear value={statusFilter} onChange={setStatusFilter}
          options={[
            { value: "all", label: "Tất cả" },
            { value: "active", label: "Hoạt động" },
            { value: "inactive", label: "Ngừng hoạt động" },
          ]}
        />
        <Input style={{ width: "300px" }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm"/>
      </div>

      <Table columns={columns} dataSource={filtered} rowKey="id" />

      <Modal open={open} title={editing ? "Sửa sản phẩm" : "Thêm sản phẩm"} onCancel={() => setOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item name="code" label="Mã" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name" label="Tên" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true }]}>
            <Select options={categories.map(c => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="price" label="Giá" rules={[{ required: true }]}><Input type="number" /></Form.Item>
          <Form.Item name="image" label="Ảnh">
            <Upload beforeUpload={() => false} maxCount={1} listType="picture">
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
            <Select options={[{ value: "active", label: "Hoạt động" }, { value: "inactive", label: "Ngừng" }]} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loadingItem}>Lưu</Button>
        </Form>
      </Modal>
    </div>
  ) 
}
