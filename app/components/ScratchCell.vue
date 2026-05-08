<script setup lang="ts">
const props = defineProps<{ symbol: string }>()
const emit = defineEmits<{ revealed: [] }>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const revealed = ref(false)
let ctx: CanvasRenderingContext2D | null = null
let isDrawing = false
let strokeCount = 0
const SIZE = 110

onMounted(() => {
  const canvas = canvasRef.value!
  canvas.width = SIZE
  canvas.height = SIZE
  ctx = canvas.getContext('2d')!
  drawFoil()
})

function drawFoil() {
  if (!ctx) return
  const g = ctx.createLinearGradient(0, 0, SIZE, SIZE)
  g.addColorStop(0, '#a8a8a8')
  g.addColorStop(0.25, '#d8d8d8')
  g.addColorStop(0.5, '#c0c0c0')
  g.addColorStop(0.75, '#e4e4e4')
  g.addColorStop(1, '#a0a0a0')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, SIZE, SIZE)

  ctx.fillStyle = 'rgba(100,100,100,0.35)'
  ctx.font = 'bold 11px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('SCRATCH', SIZE / 2, SIZE / 2)
}

function getXY(e: MouseEvent | TouchEvent): { x: number, y: number } {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  const sx = canvas.width / rect.width
  const sy = canvas.height / rect.height
  const src = e instanceof TouchEvent ? e.touches[0] : e
  return { x: (src.clientX - rect.left) * sx, y: (src.clientY - rect.top) * sy }
}

function scratch(x: number, y: number) {
  if (!ctx || revealed.value) return
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(x, y, 26, 0, Math.PI * 2)
  ctx.fill()
  strokeCount++
  if (strokeCount % 4 === 0) checkThreshold()
}

function checkThreshold() {
  if (!ctx || revealed.value) return
  const data = ctx.getImageData(0, 0, SIZE, SIZE).data
  let transparent = 0
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 128) transparent++
  }
  if (transparent / (SIZE * SIZE) > 0.55) {
    ctx.clearRect(0, 0, SIZE, SIZE)
    revealed.value = true
    emit('revealed')
  }
}

function onStart(e: MouseEvent | TouchEvent) {
  isDrawing = true
  const { x, y } = getXY(e)
  scratch(x, y)
}
function onMove(e: MouseEvent | TouchEvent) {
  if (!isDrawing) return
  const { x, y } = getXY(e)
  scratch(x, y)
}
function onEnd() { isDrawing = false }
</script>

<template>
  <div class="relative select-none shrink-0" :style="`width:${SIZE}px;height:${SIZE}px`">
    <div class="absolute inset-0 flex items-center justify-center rounded-xl bg-(--ui-bg-elevated) border border-(--ui-border) text-5xl overflow-hidden">
      {{ symbol }}
    </div>
    <canvas
      v-show="!revealed"
      ref="canvasRef"
      class="absolute inset-0 rounded-xl cursor-crosshair"
      :style="`width:${SIZE}px;height:${SIZE}px;touch-action:none`"
      @mousedown="onStart"
      @mousemove="onMove"
      @mouseup="onEnd"
      @mouseleave="onEnd"
      @touchstart.prevent="onStart"
      @touchmove.prevent="onMove"
      @touchend="onEnd"
    />
  </div>
</template>
