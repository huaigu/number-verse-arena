# 国际化快速开始指南

## 🚀 立即使用

### 1. 启动应用
```bash
npm run dev
```

### 2. 切换语言
在页面右上角找到语言切换器：
- 点击 **English** 或 **中文** 切换语言
- 语言偏好会自动保存
- 刷新页面后保持您的选择

### 3. 支持的功能

#### ✅ 完全翻译的页面
- **首页 (LandingPage)**: 所有文本和通知消息
- **创建房间 (CreateRoom)**: 所有通知消息

#### ⚠️ 部分翻译的页面
- **加入房间 (JoinRoom)**: 框架已就绪
- **游戏页面 (GamePage)**: 框架已就绪
- **排行榜 (Leaderboard)**: 框架已就绪

## 📱 用户体验

### 自动检测
- 首次访问：根据浏览器语言自动选择
- 再次访问：使用上次选择的语言

### 实时切换
- 无需刷新页面
- 所有文本立即更新
- 流畅的用户体验

## 🔧 开发者快速参考

### 在组件中使用翻译

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.title')}</h1>
      <button>{t('common.createRoom')}</button>
    </div>
  );
}
```

### 带参数的翻译

```tsx
// Toast 消息示例
toast({
  title: t('toast.foundRoom.title'),
  description: t('toast.foundRoom.description', { 
    players: 3, 
    maxPlayers: 6 
  })
});
```

### 添加新翻译

1. **英文** (`src/i18n/locales/en.ts`):
```typescript
export default {
  myFeature: {
    title: "My Feature",
    button: "Click Me"
  }
}
```

2. **中文** (`src/i18n/locales/zh.ts`):
```typescript
export default {
  myFeature: {
    title: "我的功能",
    button: "点击我"
  }
}
```

3. **使用**:
```tsx
<h1>{t('myFeature.title')}</h1>
<button>{t('myFeature.button')}</button>
```

## 📚 更多文档

- 完整使用指南: `docs/I18N.md`
- 实施总结: `I18N_SUMMARY.md`
- API 参考: [react-i18next 官方文档](https://react.i18next.com/)

## ✅ 测试清单

- [x] 安装依赖
- [x] 配置 i18next
- [x] 创建翻译文件
- [x] 添加语言切换器
- [x] 首页完全翻译
- [x] Toast 消息翻译
- [x] 构建成功

## 🎯 下一步

### 完成翻译 (优先级高)
1. 补充 JoinRoom UI 文本
2. 补充 GamePage 完整翻译
3. 补充 Leaderboard 完整翻译

### 扩展功能 (优先级中)
4. 添加更多语言 (日语、韩语等)
5. TypeScript 类型安全

---
**快速提示**: 
- 默认语言: **英文**
- 语言存储: `localStorage.i18nextLng`
- 支持语言: `en`, `zh`
