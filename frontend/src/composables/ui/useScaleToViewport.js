import { onMounted, onBeforeUnmount } from 'vue'

/**
 * 讓視窗大小自動縮放，以符合指定的設計尺寸比例
 * 
 * @param elRef - 傳入一個 ref，指向要縮放的 DOM 元素
 * @param designWidth - 預設寬度
 * @param designHeight - 預設高度
 */
export function useScaleToViewport(elRef, designWidth = 1920, designHeight = 1080) {

  // 定義縮放函式
  function resizePage() {
    const container = elRef.value
    if (!container) return // 若尚未掛載 DOM，則跳過

    // 計算目前視窗與設計尺寸的縮放比
    const scaleX = window.innerWidth / designWidth
    const scaleY = window.innerHeight / designHeight

    // 為了不讓畫面被裁切，取較小的縮放比例
    const scale = Math.min(scaleX, scaleY) 

    // 套用縮放樣式到元素
    container.style.transform = `scale(${scale})`
    container.style.width = `${designWidth}px`   // 設定原始寬度
    container.style.height = `${designHeight}px` // 設定原始高度
  }

  // 監聽視窗大小變化
  onMounted(() => {
    resizePage()
    window.addEventListener('resize', resizePage)
  })

  // 元件卸載前移除事件監聽器，避免記憶體洩漏
  onBeforeUnmount(() => {
    window.removeEventListener('resize', resizePage)
  })
}