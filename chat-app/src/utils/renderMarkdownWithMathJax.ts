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
      alert('复制失败，请手动复制');
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

// 确保依赖已加载
function ensureDependencies() {
  loadMathJax();
  addCopyCodeFunction();
  addCodeBlockStyles();
}

// 预处理方括号公式
function preprocessSquareBrackets(html: string): string {
  // 处理单独的方括号公式，例如 [ f(x) = ... ]
  return html.replace(/\[(.*?)\]/g, (match, content) => {
    // 检查是否是数学公式
    if (content.includes('\\') || content.includes('_') || content.includes('^') || 
        content.includes('\\sum') || content.includes('\\int') || content.includes('\\frac')) {
      // 将方括号替换为美元符号，以便 MathJax 能识别
      return '$' + content + '$';
    }
    // 如果不是数学公式，保持原样
    return match;
  });
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
  
  // 配置 DOMPurify 以允许我们的自定义代码块结构
  const purifyConfig = {
    ADD_TAGS: ['button', 'svg', 'path', 'rect'],
    ADD_ATTR: ['onclick', 'stroke', 'fill', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'viewBox', 'rx', 'ry']
  };
  
  // 清理 HTML
  const sanitized = DOMPurify.sanitize(html, purifyConfig);
  
  // 渲染 MathJax
  return renderMathJax(sanitized);
}

// 为 TypeScript 添加全局类型声明
declare global {
  interface Window {
    MathJax: any;
    copyCodeToClipboard: (id: string) => void;
  }
}
