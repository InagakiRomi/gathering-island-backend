<template>
  <div class="home-container">
    <div class="overlay">
      <div class="paper-card">
        <h1>登入會員</h1>
        <form @submit.prevent="handleLogin">
          <input
            type="text"
            v-model="username"
            placeholder="帳號"
            required
          />
          <input
            type="password"
            v-model="password"
            placeholder="密碼"
            required
          />
          <button type="submit" :disabled="loading">
            {{ loading ? '登入中...' : '登入' }}
          </button>
          <p class="error" v-if="errorMsg">{{ errorMsg }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

// 登入處理
const handleLogin = async () => {
  errorMsg.value = ''
  loading.value = true

  try {
    const res = await axios.post(
      'http://localhost:3000/members/login', // ⚠️ 改成你的後端網址
      {
        username: username.value,
        member_password: password.value
      },
      {
        // 允許獲取 header 中的 token
        withCredentials: false // 如果 token 是從 response header 回傳，就不需要 credentials
      }
    )

    // 從 header 取出 token
    const token = res.headers['token']

    if (token) {
      localStorage.setItem('auth_token', token)
      alert('登入成功！🎉')
      // TODO: 導向主頁或其他頁面
    } else {
      errorMsg.value = '未取得登入憑證，請聯繫管理員'
    }

  } catch (err: any) {
    if (err.response && err.response.data === 'Invalid username or password') {
      errorMsg.value = '帳號或密碼錯誤 ❌'
    } else {
      errorMsg.value = '登入失敗，請稍後再試 ⚠️'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.home-container {
  background-image: var(--background-image-url, url('https://source.unsplash.com/1600x900/?technology'));
  background-size: cover;
  background-position: center;
  height: 100vh;
  width: 100vw;
  position: relative;
}

.overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.paper-card {
  background: white;
  padding: 3rem 2.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 400px;
  text-align: center;
  animation: fadeIn 0.6s ease-in-out;
}

.paper-card h1 {
  margin-bottom: 2rem;
  font-size: 2rem;
  color: #333;
}

.paper-card form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.paper-card input {
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s;
}

.paper-card input:focus {
  border-color: #5b86e5;
}

.paper-card button {
  background: linear-gradient(135deg, #36d1dc, #5b86e5);
  color: white;
  padding: 0.75rem;
  font-size: 1.1rem;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-weight: bold;
}

.paper-card button:hover {
  background: linear-gradient(135deg, #5b86e5, #36d1dc);
}

.error {
  color: red;
  margin-top: 1rem;
  font-size: 0.95rem;
  font-weight: 500;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>