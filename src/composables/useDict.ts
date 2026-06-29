import { ref, shallowRef } from 'vue'
import { getDict } from '@/api/dict'
import type { DictData } from '@/types/dict'

const data = shallowRef<DictData | null>(null)
const loading = ref(false)

export function useDict() {
  async function ensure() {
    if (data.value) return data.value
    if (loading.value) {
      // 简单等待已有请求完成
      return new Promise<DictData>((resolve) => {
        const check = () => {
          if (data.value) resolve(data.value)
          else setTimeout(check, 50)
        }
        check()
      })
    }
    loading.value = true
    try {
      const res = await getDict()
      data.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  function options(key: keyof DictData) {
    return data.value?.[key].map((v) => ({ label: v, value: v })) ?? []
  }

  return { data, ensure, options }
}
