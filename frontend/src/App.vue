<template>
  <!-- 自動顯示切換到的頁面內容 -->
  <router-view />
</template>

<style>
/* 強制移除所有元素的邊距與內距 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 清除 body 預設 margin，並讓它撐滿整個螢幕 */
html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>