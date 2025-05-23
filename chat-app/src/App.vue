<script setup lang="ts">
// 简化版 App.vue
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style>
/* 全局样式 */
:root {
  --td-brand-color: #0052d9;
  --td-brand-color-hover: #266fe8;
  --td-brand-color-focus: #0045b6;
  --td-brand-color-active: #0037a6;
  --td-brand-color-light: #ecf2fe;
  --td-brand-color-light-hover: #d5e3ff;

  /* 添加缺失的颜色变量（可按需要自定义） */
  --td-text-color-primary: #1f1f1f;
  --td-bg-color-page: #ffffff;
}

html, body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--td-text-color-primary);
  background-color: var(--td-bg-color-page);
  overflow: hidden;
}

#app {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
