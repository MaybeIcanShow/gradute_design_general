<template>
  <div class="legend">
    <div class="legend-item">
      <div class="legend-color logic-color"></div>
      <span>表达逻辑错误</span>
    </div>
    <div class="legend-item">
      <div class="legend-color vocabulary-color"></div>
      <span>词汇错误</span>
    </div>
    <div class="legend-item">
      <div class="legend-color grammar-color"></div>
      <span>语法错误</span>
    </div>
    <div class="legend-item">
      <div class="legend-color other-color"></div>
      <span>其他错误</span>
    </div>
  </div>
</template>

<style scoped>
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 15px 0;
  padding: 10px;
  background-color: #f3f3f3;
  border-radius: 4px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-right: 10px;
}

.legend-color {
  width: 20px;
  height: 20px;
  margin-right: 5px;
  border-radius: 3px;
}

/* 颜色图例 */
.grammar-color { background-color: red; }
.vocabulary-color { background-color: #9c27b0; }
.logic-color { background-color: #ff5722; }
.other-color { background-color: #009688; }
</style> 