export type ProductStatus = "active" | "inactive"
export type CategoryStatus = "active" | "inactive"

export type ProductRow = {
  id: string
  code: string
  name: string
  categoryId: string
  price: number
  image: string
  status: ProductStatus
}

export type CategoryRow = {
  id: string
  name: string
  description: string
  status: CategoryStatus
}
