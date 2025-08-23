import { defineStore } from 'pinia'

export const useViewStore = defineStore('view', {
  state: () => ({
    currentView: 'dashboard',
  }),
  actions: {
    setView(view) {
      this.currentView = view
    },
  },
  persist: true,
})
