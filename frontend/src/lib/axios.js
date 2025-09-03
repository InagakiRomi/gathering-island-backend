import axios from 'axios'

// 建立一個 axios 實例，並設定 baseURL 來自於 .env 檔
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

export default api