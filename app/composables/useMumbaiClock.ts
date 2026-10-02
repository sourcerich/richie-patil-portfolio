// Mumbai local time as HH:MM, ticking once a second while mounted. Renders
// "--:--" on the server so the prerendered page never shows a stale time.
export const useMumbaiClock = () => {
  const time = ref('--:--')
  const tick = () => {
    time.value = new Date().toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  let timer: ReturnType<typeof setInterval> | undefined
  onMounted(() => {
    tick()
    timer = setInterval(tick, 1000)
  })
  onBeforeUnmount(() => clearInterval(timer))
  return time
}
