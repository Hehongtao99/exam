import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => {
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('初始化用户状态：', savedUser);
    return {
      id: savedUser.id || null,
      username: savedUser.username || '',
      nickname: savedUser.nickname || '',
      avatar: savedUser.avatar || '',
      signature: savedUser.signature || '',
      role: savedUser.role || null
    };
  },

  actions: {
    setUser(user) {
      console.log('设置用户信息：', user);
      this.id = user.id;
      this.username = user.username;
      this.nickname = user.nickname;
      this.avatar = user.avatar;
      this.signature = user.signature;
      this.role = user.role;
      localStorage.setItem('user', JSON.stringify(user));
    },

    clearUser() {
      console.log('清除用户信息');
      this.id = null;
      this.username = '';
      this.nickname = '';
      this.avatar = '';
      this.signature = '';
      this.role = null;
      localStorage.removeItem('user');
    }
  },

  getters: {
    isAdmin: (state) => state.role === 'admin',
    isLoggedIn: (state) => !!state.id
  }
}); 