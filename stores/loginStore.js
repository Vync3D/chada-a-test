import { defineStore } from 'pinia'

export const useLoginStore = defineStore('loginStore', {
  state: () => ({
    role: 'employee',
    identifier: '',
    password: '',
    agreed: false,
  }),
  actions: {
    saveState(data) {
      this.role = data.role
      this.identifier = data.identifier
      this.password = data.password
      this.agreed = data.agreed
    },
  },
  persist: true,
})
