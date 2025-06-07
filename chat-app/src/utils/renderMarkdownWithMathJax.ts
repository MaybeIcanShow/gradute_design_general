// src/utils/renderMarkdownWithMathJax.ts
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

// 创建 markdown-it 实例
const md = new MarkdownIt({
  html: true,        // 启用 HTML 标签
  breaks: true,      // 将换行符转换为 <br>
  linkify: true,     // 自动识别链接
  typographer: true, // 启用排版增强
  highlight: function(str: string, lang: string): string {
    // 语法高亮
    if (lang && hljs.getLanguage(lang)) {
      try {
        // 生成随机ID，用于复制功能
        const id = 'code-' + Math.random().toString(36).substring(2, 15);
        
        // 高亮代码
        const highlighted = hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
        
        // 创建带有复制按钮的代码块HTML
        return `
          <div class="code-block-wrapper">
            <div class="code-header">
              <span class="code-language">${lang || 'text'}</span>
              <button class="copy-button" onclick="copyCodeToClipboard('${id}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                复制
              </button>
            </div>
            <pre><code id="${id}" class="hljs ${lang || ''}">${highlighted}</code></pre>
          </div>
        `;
      } catch (e) {
        console.error('Syntax highlighting error:', e);
      }
    }
    
    // 如果没有指定语言或者高亮失败，使用普通代码块
    return `<pre><code>${md.utils.escapeHtml(str)}</code></pre>`;
  }
});

// 添加复制代码功能到全局
function addCopyCodeFunction() {
  // 检查函数是否已定义，而不是直接检查window对象上是否存在
  try {
    if (typeof window.copyCodeToClipboard === 'function') {
      return; // 已经添加过
    }
  } catch (e) {
    // 如果window还未定义或不支持这个属性
  }
  
  window.copyCodeToClipboard = function(id: string) {
    const codeElement = document.getElementById(id);
    if (!codeElement) return;
    
    // 获取代码文本
    const text = codeElement.textContent || '';
    
    // 复制到剪贴板
    navigator.clipboard.writeText(text).then(() => {
      // 找到复制按钮
      const button = codeElement.closest('.code-block-wrapper')?.querySelector('.copy-button');
      if (button) {
        // 临时改变按钮文本
        const originalHTML = button.innerHTML;
        button.innerHTML = '已复制 ✓';
        
        // 2秒后还原
        setTimeout(() => {
          button.innerHTML = originalHTML;
        }, 2000);
      }
    }).catch(err => {
      console.error('复制失败:', err);
      
      // 找到复制按钮，显示错误信息
      const button = codeElement.closest('.code-block-wrapper')?.querySelector('.copy-button');
      if (button) {
        // 临时改变按钮文本显示错误
        const originalHTML = button.innerHTML;
        button.innerHTML = '复制失败 ✗';
        (button as HTMLElement).style.color = 'red';
        
        // 2秒后还原
        setTimeout(() => {
          button.innerHTML = originalHTML;
          (button as HTMLElement).style.color = '';
        }, 2000);
      }
    });
  };
}

// 添加 MathJax 脚本到页面
function loadMathJax() {
  if (document.getElementById('mathjax-script')) {
    return; // 已经加载过
  }
  
  // 添加 MathJax 配置
  const configScript = document.createElement('script');
  configScript.type = 'text/javascript';
  configScript.text = `
    window.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\[', '\\]']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true
      },
      svg: {
        fontCache: 'global'
      },
      options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
      }
    };
  `;
  document.head.appendChild(configScript);
  
  // 添加 MathJax 脚本
  const script = document.createElement('script');
  script.id = 'mathjax-script';
  script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
  script.async = true;
  document.head.appendChild(script);
}

// 添加代码块样式
function addCodeBlockStyles() {
  if (document.getElementById('code-block-styles')) {
    return; // 已经添加过
  }
  
  const style = document.createElement('style');
  style.id = 'code-block-styles';
  style.textContent = `
    .code-block-wrapper {
      margin: 1em 0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }
    
    .code-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      background-color: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .code-language {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }
    
    .copy-button {
      display: flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: none;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 12px;
      color: #666;
      border-radius: 4px;
    }
    
    .copy-button:hover {
      background-color: #e0e0e0;
    }
    
    .hljs {
      padding: 1em;
      border-radius: 0 0 8px 8px;
    }
    
    /* 改进表格样式 */
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 1em;
    }
    
    th, td {
      border: 1px solid #e0e0e0;
      padding: 8px 12px;
    }
    
    th {
      background-color: #f5f5f5;
      font-weight: 600;
    }
    
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
  `;
  
  document.head.appendChild(style);
}

// 添加反思token样式
function addReflectionTokenStyles() {
  if (document.getElementById('reflection-token-styles')) {
    return; // 已经添加过
  }
  
  const style = document.createElement('style');
  style.id = 'reflection-token-styles';
  style.textContent = `
    /* 反思token样式 */
    .reflection-token {
      display: inline-block;
      padding: 1px 4px;
      margin: 0 2px;
      border-radius: 3px;
      font-size: 0.85em;
      font-weight: 500;
      line-height: 1.2;
    }
    
    /* 检索相关token */
    .token-retrieve {
      background-color: #e3f2fd;
      color: #1976d2;
      border: 1px solid #bbdefb;
    }
    
    .token-no-retrieve {
      background-color: #f5f5f5;
      color: #757575;
      border: 1px solid #e0e0e0;
    }
    
    /* 相关性token */
    .token-relevant {
      background-color: #e8f5e9;
      color: #388e3c;
      border: 1px solid #c8e6c9;
    }
    
    .token-irrelevant {
      background-color: #ffebee;
      color: #d32f2f;
      border: 1px solid #ffcdd2;
    }
    
    /* 支持度token */
    .token-fully-supported {
      background-color: #e8f5e9;
      color: #388e3c;
      border: 1px solid #c8e6c9;
    }
    
    .token-partially-supported {
      background-color: #fff8e1;
      color: #ffa000;
      border: 1px solid #ffecb3;
    }
    
    .token-no-support {
      background-color: #ffebee;
      color: #d32f2f;
      border: 1px solid #ffcdd2;
    }
    
    /* 有用性token */
    .token-utility-5 {
      background-color: #e8f5e9;
      color: #388e3c;
      border: 1px solid #c8e6c9;
    }
    
    .token-utility-3 {
      background-color: #fff8e1;
      color: #ffa000;
      border: 1px solid #ffecb3;
    }
    
    .token-utility-1 {
      background-color: #ffebee;
      color: #d32f2f;
      border: 1px solid #ffcdd2;
    }
    
    /* 文档列表项样式 */
    strong {
      font-weight: 600;
      color: #333;
    }
  `;
  
  document.head.appendChild(style);
}

// 增强渲染，处理反思token
function enhanceWithReflectionTokens(html: string): string {
  // 添加反思token样式
  addReflectionTokenStyles();
  
  // 定义反思token正则表达式和对应的样式类
  const tokenPatterns = [
    { regex: /\[Retrieve\]/g, class: 'token-retrieve' },
    { regex: /\[No Retrieve\]/g, class: 'token-no-retrieve' },
    { regex: /\[Relevant\]/g, class: 'token-relevant' },
    { regex: /\[Irrelevant\]/g, class: 'token-irrelevant' },
    { regex: /\[Fully supported\]/g, class: 'token-fully-supported' },
    { regex: /\[Partially supported\]/g, class: 'token-partially-supported' },
    { regex: /\[No support \/ Contradictory\]/g, class: 'token-no-support' },
    { regex: /\[Utility:5\]/g, class: 'token-utility-5' },
    { regex: /\[Utility:3\]/g, class: 'token-utility-3' },
    { regex: /\[Utility:1\]/g, class: 'token-utility-1' }
  ];
  
  // 处理每种反思token
  let enhancedHtml = html;
  tokenPatterns.forEach(pattern => {
    enhancedHtml = enhancedHtml.replace(
      pattern.regex,
      `<span class="reflection-token ${pattern.class}">$&</span>`
    );
  });
  
  // 增加处理文档列表项，在文档项之间添加换行
  // 匹配"文档1:"、"文档2:"、"文档 1:"等格式
  enhancedHtml = enhancedHtml.replace(
    /(文档\s*\d+\s*:)/g, 
    '<br><br><strong>$1</strong>'
  );
  
  // 处理"总结:"和"总结："格式，增加换行和加粗
  enhancedHtml = enhancedHtml.replace(
    /(总结\s*[:：])/g,
    '<br><br><strong>$1</strong>'
  );
  
  return enhancedHtml;
}

// 确保依赖已加载
function ensureDependencies() {
  loadMathJax();
  addCopyCodeFunction();
  addCodeBlockStyles();
  addReflectionTokenStyles(); // 添加反思token样式
}

// 修改预处理方括号公式函数，添加对反思token的特殊处理
function preprocessSquareBrackets(html: string): string {
  // 先标记反思token，确保它们不被处理为公式
  const reflectionTokens = [
    '[Retrieve]', 
    '[No Retrieve]', 
    '[Relevant]', 
    '[Irrelevant]', 
    '[Fully supported]', 
    '[Partially supported]', 
    '[No support / Contradictory]',
    '[Utility:5]',
    '[Utility:3]',
    '[Utility:1]'
  ];
  
  // 创建一个临时html用于处理
  let processedHtml = html;
  
  // 临时替换反思token为唯一标记，以防止它们被处理
  reflectionTokens.forEach((token, index) => {
    const placeholder = `__REFLECTION_TOKEN_${index}__`;
    // 使用全局正则表达式替换所有出现的token
    const tokenRegex = new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    processedHtml = processedHtml.replace(tokenRegex, placeholder);
  });
  
  // 处理可能是数学公式的方括号内容
  processedHtml = processedHtml.replace(/\[(.*?)\]/g, (match, content) => {
    // 检查是否是数学公式
    if (content.includes('\\') || content.includes('_') || content.includes('^') || 
        content.includes('\\sum') || content.includes('\\int') || content.includes('\\frac')) {
      // 将方括号替换为美元符号，以便 MathJax 能识别
      return '$' + content + '$';
    }
    // 如果不是数学公式，保持原样
    return match;
  });
  
  // 恢复反思token
  reflectionTokens.forEach((token, index) => {
    const placeholder = `__REFLECTION_TOKEN_${index}__`;
    // 使用全局正则表达式替换所有占位符
    const placeholderRegex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    processedHtml = processedHtml.replace(placeholderRegex, token);
  });
  
  return processedHtml;
}

// 渲染 LaTeX 公式
function renderMathJax(html: string): string {
  // 预处理方括号公式
  html = preprocessSquareBrackets(html);
  
  // 触发 MathJax 处理
  setTimeout(() => {
    if (window.MathJax && window.MathJax.typeset) {
      window.MathJax.typeset();
    } else {
      // 如果 MathJax 还没准备好，稍后再试
      setTimeout(() => {
        if (window.MathJax && window.MathJax.typeset) {
          window.MathJax.typeset();
        }
      }, 1000);
    }
  }, 0);
  
  return html;
}

// 导出主函数：支持 markdown + MathJax + 高亮
export function renderMarkdownWithMathJax(raw: string): string {
  // 确保依赖已加载
  ensureDependencies();
  
  // 处理空内容
  if (!raw) return '';
  
  // 渲染 Markdown
  const html = md.render(raw);
  
  // 配置 DOMPurify 以允许我们的自定义代码块结构和反思token样式
  const purifyConfig = {
    ADD_TAGS: ['button', 'svg', 'path', 'rect', 'span'],
    ADD_ATTR: ['onclick', 'stroke', 'fill', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'viewBox', 'rx', 'ry', 'class']
  };
  
  // 清理 HTML
  const sanitized = DOMPurify.sanitize(html, purifyConfig);
  
  // 增强处理反思token
  const enhanced = enhanceWithReflectionTokens(sanitized);
  
  // 渲染 MathJax
  return renderMathJax(enhanced);
}

// 为 TypeScript 添加全局类型声明
declare global {
  interface Window {
    MathJax: any;
    copyCodeToClipboard: (id: string) => void;
  }
}
