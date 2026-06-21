# 人际关系管理工具

一个简洁、现代化的人际关系和纪念日管理工具，帮助你记录亲友的生日和重要纪念日，不再错过任何重要的日子。

## 功能截图

> 截图位置：可将截图放置于 `screenshots/` 目录下

- 首页日历：`screenshots/home.png`
- 人物列表：`screenshots/people.png`
- 添加人物：`screenshots/add-person.png`
- 人物详情：`screenshots/person-detail.png`
- 纪念日列表：`screenshots/anniversaries.png`

## 技术栈

### 前端
- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **UI 组件库**: Vant 4
- **路由**: Vue Router 4
- **HTTP 请求**: Axios

### 后端
- **运行环境**: Node.js
- **框架**: Express
- **数据库**: MySQL
- **ORM/驱动**: mysql2
- **文件上传**: Multer
- **配置管理**: dotenv

## 目录结构

```
relationship-manager/
├── client/                 # 前端项目
│   ├── src/
│   │   ├── api/            # API 接口封装
│   │   ├── components/     # 公共组件
│   │   ├── pages/          # 页面组件
│   │   ├── router/         # 路由配置
│   │   ├── styles/         # 全局样式
│   │   ├── App.vue         # 根组件
│   │   └── main.js         # 入口文件
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/                 # 后端项目
│   ├── routes/             # 路由接口
│   │   ├── people.js       # 人物相关接口
│   │   └── anniversaries.js # 纪念日相关接口
│   ├── uploads/            # 头像上传目录
│   ├── .env                # 环境变量配置
│   ├── .env.example        # 环境变量示例
│   ├── db.js               # 数据库连接
│   ├── index.js            # 服务入口
│   └── package.json
├── database.sql            # 数据库初始化 SQL（含示例数据）
├── .gitignore
└── README.md
```

## 安装依赖

### 前置要求
- Node.js >= 16.0.0
- MySQL >= 5.7 或 8.0

### 后端依赖
```bash
cd server
npm install
```

### 前端依赖
```bash
cd client
npm install
```

## 数据库配置

### 1. 修改后端配置文件
复制或编辑 `server/.env` 文件，修改数据库连接信息：

```env
# 数据库地址
DB_HOST=localhost
# 数据库端口
DB_PORT=3306
# 数据库用户名
DB_USER=root
# 数据库密码
DB_PASSWORD=123456
# 数据库名称
DB_NAME=relationship_manager

# 服务端口
PORT=3001

# 上传文件最大大小(MB)
MAX_UPLOAD_SIZE=5
```

## 导入 SQL

在 MySQL 中执行项目根目录下的 `database.sql` 文件：

```bash
# 方式一：命令行导入
mysql -u root -p < database.sql

# 方式二：在 MySQL 客户端中执行
source /path/to/database.sql
```

该 SQL 文件会自动：
1. 创建 `relationship_manager` 数据库
2. 创建 `people`（人物表）和 `anniversaries`（纪念日表）
3. 插入 5 条示例人物数据和对应的纪念日数据

## 启动后端

```bash
cd server
npm start
```

后端服务启动后，访问地址：`http://localhost:3001`

测试接口：访问 `http://localhost:3001/`，返回 JSON 数据表示服务正常。

## 启动前端

```bash
cd client
npm run dev
```

前端服务启动后，访问地址：`http://localhost:5173`

## 默认访问地址

| 服务 | 地址 |
|------|------|
| 前端页面 | http://localhost:5173 |
| 后端 API | http://localhost:3001 |

前端已配置代理，`/api` 和 `/uploads` 请求会自动转发到后端服务。

## 接口说明

### 通用响应格式
```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```
- `code`: 状态码，0 表示成功，非 0 表示失败
- `message`: 提示信息
- `data`: 返回数据

---

### 人物相关接口

#### 1. 获取人物列表
- **URL**: `GET /api/people`
- **响应数据**:
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "张伟",
      "avatar": null,
      "birthday": "1990-06-15",
      "relation": "朋友",
      "contact": "13800138001",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 2. 获取人物详情
- **URL**: `GET /api/people/:id`
- **参数**: `id` - 人物 ID
- **响应数据**: 人物信息 + 纪念日列表

#### 3. 添加人物
- **URL**: `POST /api/people`
- **请求体**:
```json
{
  "name": "姓名",
  "avatar": "/uploads/xxx.jpg",
  "birthday": "1990-01-01",
  "relation": "朋友",
  "contact": "13800138000",
  "anniversaries": [
    { "title": "结婚纪念日", "date": "2020-01-01" }
  ]
}
```

#### 4. 编辑人物
- **URL**: `PUT /api/people/:id`
- **请求体**: 同添加人物

#### 5. 删除人物
- **URL**: `DELETE /api/people/:id`

#### 6. 上传头像
- **URL**: `POST /api/people/upload`
- **Content-Type**: `multipart/form-data`
- **参数**: `avatar` - 图片文件
- **响应数据**:
```json
{
  "code": 0,
  "message": "上传成功",
  "data": { "url": "/uploads/avatar-xxx.jpg" }
}
```

---

### 纪念日相关接口

#### 1. 获取某个人物的纪念日列表
- **URL**: `GET /api/anniversaries/person/:personId`

#### 2. 添加纪念日
- **URL**: `POST /api/anniversaries`
- **请求体**:
```json
{
  "person_id": 1,
  "title": "纪念日名称",
  "date": "2020-01-01",
  "type": "custom"
}
```

#### 3. 编辑纪念日
- **URL**: `PUT /api/anniversaries/:id`
- **请求体**:
```json
{
  "title": "纪念日名称",
  "date": "2020-01-01"
}
```

#### 4. 删除纪念日
- **URL**: `DELETE /api/anniversaries/:id`

#### 5. 获取即将到来的纪念日列表
- **URL**: `GET /api/anniversaries/upcoming?limit=0`
- **参数**: `limit` - 返回数量限制，0 表示全部
- **响应数据**: 按距今天数升序排列，包含 `daysUntil` 字段表示剩余天数

#### 6. 获取指定年月日历中的纪念日数据
- **URL**: `GET /api/anniversaries/calendar/:year/:month`
- **参数**: `year` 年份，`month` 月份（1-12）
- **响应数据**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "15": [
      {
        "id": 1,
        "person_id": 1,
        "title": "张伟的生日",
        "date": "1990-06-15",
        "type": "birthday",
        "name": "张伟",
        "avatar": null
      }
    ]
  }
}
```
返回对象的 key 为日期（1-31），value 为当天的纪念日数组。

## 后续开发计划

- [ ] 数据导出/导入功能
- [ ] 纪念日提醒通知（邮件/短信/推送）
- [ ] 人物分组/标签功能
- [ ] 人物搜索功能
- [ ] 数据统计和可视化
- [ ] 多用户支持和权限管理
- [ ] PWA 支持，可添加到手机桌面
- [ ] 暗色主题切换
- [ ] 国际多语言支持

## 开发说明

### 前端开发
前端使用 Vite 作为构建工具，支持热更新。API 请求通过 `src/api/request.js` 封装的 Axios 实例发送，已配置自动错误提示。

新增页面步骤：
1. 在 `src/pages/` 下创建页面组件
2. 在 `src/router/index.js` 中添加路由配置
3. 如果页面不需要底部导航，设置 `meta.showNav = false`

### 后端开发
后端使用 Express 框架，路由位于 `server/routes/` 目录下。

新增接口步骤：
1. 在 `server/routes/` 下创建或修改路由文件
2. 在 `server/index.js` 中注册路由
3. 数据库操作使用 `server/db.js` 导出的连接池

## 开源协议

MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
