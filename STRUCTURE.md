# 项目文件结构

```
ai-robot-chat/
├── app/                           # Next.js App Router
│   ├── api/                        # API路由
│   │   └── chat/
│   │       └── route.ts            # 智谱AI聊天API端点
│   ├── globals.css                 # 全局样式
│   ├── layout.tsx                  # 根布局组件
│   └── page.tsx                    # 主页面
│
├── components/                     # React组件
│   ├── 3d/                         # 3D渲染组件
│   │   ├── RobotModel.tsx          # 3D机器人模型
│   │   └── Scene.tsx               # Three.js场景
│   │
│   └── ui/                         # UI组件
│       ├── ChatPanel.tsx           # 对话面板
│       ├── VoiceControl.tsx        # 语音控制
│       └── SettingsPanel.tsx       # 设置面板
│
├── hooks/                         # 自定义React Hooks
│   ├── useGLMChat.ts              # GLM对话Hook
│   ├── useSpeechRecognition.ts    # 语音识别Hook
│   └── useSpeechSynthesis.ts      # 语音合成Hook
│
├── lib/                           # 工具库
│   ├── glm.ts                     # 智谱AI客户端
│   └── robot/                     # 机器人相关
│       ├── geometries.ts          # 程序化几何体
│       └── animations.ts          # 动画控制系统
│
├── store/                         # 状态管理
│   └── useStore.ts                # Zustand全局状态
│
├── types/                         # TypeScript类型定义
│   └── index.ts
│
├── public/                        # 静态资源
│   └── favicon.ico.svg            # 网站图标
│
├── .env.example                   # 环境变量示例
├── .gitignore                     # Git忽略文件
├── next.config.js                 # Next.js配置
├── package.json                   # 项目依赖
├── postcss.config.js              # PostCSS配置
├── QUICKSTART.md                  # 快速开始指南
├── README.md                      # 项目说明
├── tailwind.config.js             # Tailwind CSS配置
├── tsconfig.json                  # TypeScript配置
└── vercel.json                    # Vercel部署配置
```

## 核心文件说明

### 页面组件
- `app/page.tsx` - 主应用页面，整合所有功能模块

### 3D组件
- `components/3d/Scene.tsx` - Three.js Canvas和渲染设置
- `components/3d/RobotModel.tsx` - 机器人模型和动画控制

### UI组件
- `components/ui/ChatPanel.tsx` - 对话消息显示和输入
- `components/ui/VoiceControl.tsx` - 语音识别/合成控制
- `components/ui/SettingsPanel.tsx` - 配置面板

### Hooks
- `hooks/useGLMChat.ts` - 处理与智谱AI的通信
- `hooks/useSpeechRecognition.ts` - 中文语音识别
- `hooks/useSpeechSynthesis.ts` - 中文语音合成

### 库文件
- `lib/glm.ts` - 智谱AI API客户端实现
- `lib/robot/geometries.ts` - 机器人各部位几何体创建
- `lib/robot/animations.ts` - 表情动画和姿态控制

### 状态管理
- `store/useStore.ts` - 全局应用状态（消息、表情、状态）

### API路由
- `app/api/chat/route.ts` - Next.js API路由，代理智谱AI请求
