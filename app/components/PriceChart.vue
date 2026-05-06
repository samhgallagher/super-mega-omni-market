<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

const props = defineProps<{
  history: Array<{
    timestamp: number
    outcomes: Array<{ id: string, label: string, price: number }>
  }>
  outcomes: Array<{ id: string, label: string }>
}>()

const COLORS = ['#2155d6', '#e55a2b', '#16a34a', '#9333ea', '#ea580c', '#0891b2']

const chartData = computed(() => ({
  labels: props.history.map(h =>
    new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  ),
  datasets: props.outcomes.map((outcome, i) => ({
    label: outcome.label,
    data: props.history.map(h => {
      const o = h.outcomes.find(o => o.id === outcome.id)
      return o ? Math.round(o.price * 100) : null
    }),
    borderColor: COLORS[i % COLORS.length],
    backgroundColor: COLORS[i % COLORS.length] + '18',
    fill: false,
    tension: 0.3,
    pointRadius: 2,
    pointHoverRadius: 5
  }))
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      min: 0,
      max: 100,
      ticks: { callback: (val: number | string) => `${val}%` }
    },
    x: {
      ticks: { maxTicksLimit: 8, maxRotation: 0 }
    }
  },
  plugins: {
    legend: { position: 'bottom' as const },
    tooltip: {
      callbacks: {
        label: (ctx: { dataset: { label: string }, raw: unknown }) => `${ctx.dataset.label}: ${ctx.raw}%`
      }
    }
  }
}
</script>

<template>
  <div v-if="history.length" class="h-64">
    <Line :data="chartData" :options="chartOptions" />
  </div>
  <div v-else class="h-32 flex items-center justify-center text-sm text-muted">
    No trading history yet.
  </div>
</template>
