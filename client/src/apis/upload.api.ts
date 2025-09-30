import axios from "axios"

export const uploadImg = async(file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", "re_upload")
    const response = await axios.post("https://api.cloudinary.com/v1_1/dxkw3nupk/image/upload",formData)
    return response.data.secure_url
}
