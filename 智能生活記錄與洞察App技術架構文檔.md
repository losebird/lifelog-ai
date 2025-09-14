# 智能生活記錄與洞察App技術架構文檔

**版本**: 1.0  
**日期**: 2025-09-14  
**作者**: Winston (Architect)

---

## 一、引言 (Introduction)

本文檔闡述了“智能生活記錄與洞察App”的完整全棧架構，涵蓋後端系統、前端實現及其集成方案。它是指導AI驅動開發的唯一技術藍圖，旨在確保整個技術棧的一致性。本文檔基於已鎖定的 `prd-complete-v1.md` 和 `Epics_and_Stories.md` 進行設計。

### 啟動模板或現有項目 (Starter Template or Existing Project)

- **決策**: 從零開始 (From Scratch)
- **理由**: 為了最大限度地保證架構的靈活性和對“本地優先”原則的精確控制，我們選擇不基於任何現有的啟動模板進行開發。

### 變更日誌 (Change Log)

| 日期       | 版本 | 描述               | 作者      |
|------------|------|--------------------|-----------|
| 2025-09-14 | 1.0  | 初始架構草案創建 | Winston (Architect) |

---

## 二、高級架構 (High Level Architecture)

### 技術摘要 (Technical Summary)

本項目將採用基於 React Native 的跨平台客戶端架構，通過 GraphQL API 與一個輕量級的 FastAPI (Python) 後端服務進行通信。整體遵循 **本地優先 (Local-First)** 的設計哲學，客戶端負責所有核心數據的處理與存儲，而後端則專注於用戶認證、加密數據的同步以及協作功能的協調。所有需要大量計算的AI任務將通過客戶端直接調用用戶配置的第三方雲端AI服務來完成。

### 倉庫結構 (Repository Structure)

- **結構**: Monorepo
- **理由**: 該結構將客戶端 (app)、後端 (server) 和共享代碼 (shared) 放置在同一個倉庫中，極大地簡化了跨端類型定義和邏輯複用的管理，是實現我們全棧技術願景的最佳選擇。

### 高級架構圖 (High Level Architecture Diagram)

```mermaid
graph TD
    subgraph 用戶設備 (Client Devices)
        A[iOS App <br>(React Native)]
        B[Android App <br>(React Native)]
        C[Web App <br>(React Native for Web)]
    end

    subgraph 雲端服務 (Cloud Services)
        D[輕量級後端 <br>(FastAPI on Cloud Run/Lambda)]
        E[數據庫 <br>(PostgreSQL)]
        F[第三方AI服務 <br>(User's Own API Key)]
    end

    A -- GraphQL API --> D
    B -- GraphQL API --> D
    C -- GraphQL API --> D

    D <--> E

    A -- REST/gRPC --> F
    B -- REST/gRPC --> F
    C -- REST/gRPC --> F

    style A fill:#D6EAF8
    style B fill:#D6EAF8
    style C fill:#D6EAF8
    style D fill:#E8DAEF
    style E fill:#D5F5E3
    style F fill:#FCF3CF
```

### 架構模式 (Architectural Patterns)

- **本地優先 (Local-First)**: 應用的核心狀態和數據存在於客戶端，確保離線可用性和數據主權。
- **客戶端-服務器 (Client-Server)**: 用於認證和數據同步。
- **事件驅動同步 (Event-Driven Sync)**: 本地數據的變更將作為事件，在網絡可用時觸發向後端的同步。
- **服務層模式 (Service Layer)**: 在客戶端和後端都將採用服務層來封裝業務邏輯，與UI和數據庫解耦。

---

## 三、技術棧 (Tech Stack)

### 技術棧總覽表

| 類別         | 技術選型              | 版本  | 用途與理由                                                                 |
|--------------|-----------------------|-------|----------------------------------------------------------------------------|
| **通用**     | TypeScript            | ~5.x  | 為整個項目提供類型安全，尤其在Monorepo中能確保前後端數據結構一致。         |
| **客戶端**   | React Native          | ~0.7x | 核心跨平台框架，通過一套代碼庫覆蓋iOS、Android和Web。                     |
|              | React Native for Web | ~0.19 | 將React Native組件編譯為Web應用，實現Web端支持。                           |
|              | WatermelonDB          | ~0.27 | 為React Native優化的高性能響應式數據庫，完美支持我們的“本地優先”架構。   |
| **後端框架** | FastAPI               | ~0.10x| 基於Python的高性能異步框架，開發效率高，文檔自動生成，非常適合構建我們的輕量級後端。 |
| **API 規範** | GraphQL               | -     | 允許客戶端按需請求數據，減少網絡負載，非常適合多端、數據結構複雜的應用。 |
| **後端數據庫**| PostgreSQL            | 15+   | 功能強大、穩定可靠的開源關係型數據庫，用於存儲用戶賬戶和加密的同步數據。 |
| **AI 服務集成**| REST / gRPC          | -     | 客戶端將直接通過標準協議與用戶配置的第三方AI服務商API進行通信。           |
| **UI 組件庫**| React Native Paper    | ~5.x  | 提供一套高質量的、遵循Material Design的跨平台UI組件，加速開發。           |
| **狀態管理** | Zustand               | ~4.x  | 輕量、簡潔的React狀態管理庫，易於上手且性能優秀。                         |

---

## 四、數據模型 (Data Models)

### User (用戶)

- **用途**: 存儲用戶的賬戶信息、認證憑證以及訂閱狀態。這是後端服務管理的核心模型。
- **關鍵屬性**:
  - `id`: 唯一標識符
  - `email`: 郵箱，用於登錄
  - `password_hash`: 加密後的密碼
  - `subscription_status`: 訂閱狀態 ('free' 或 'pro')
  - `created_at`: 創建時間
  - `updated_at`: 更新時間

- **TypeScript 接口** (`packages/shared/src/types/user.ts`)

  ```typescript
  export interface User {
    id: string;
    email: string;
    subscription_status: 'free' | 'pro';
    created_at: Date;
    updated_at: Date;
  }
  ```

### Record (記錄)

- **用途**: 這是應用的核心數據模型，用於存儲用戶創建的所有類型的內容。它是一個多態模型，通過 `type` 字段來區分不同的記錄類型。此模型主要存在於客戶端的本地數據庫中。
- **關鍵屬性**:
  - `id`: 唯一標識符
  - `type`: 記錄類型 ('note', 'voice', 'link', 'file', 'image', 'emotion' 等)
  - `content`: 記錄的主要內容 (JSON 格式，結構根據 `type` 而變化)
  - `plain_text_content`: 用於全文搜索的純文本內容
  - `created_at`: 創建時間
  - `updated_at`: 更新時間
  - `user_id`: (後端關聯) 關聯的用戶ID

- **關係**:
  - 與 Tag 是多對多關係。

- **TypeScript 接口** (`packages/shared/src/types/record.ts`)

  ```typescript
  // 定義不同類型記錄的內容結構
  interface NoteContent {
    title: string;
    body: string; // Markdown content
  }

  interface VoiceContent {
    audio_url: string;
    transcript?: string;
    duration_seconds: number;
  }

  // ... 其他內容類型的接口 ...

  export type RecordContent = NoteContent | VoiceContent | LinkContent | any;

  export interface Record {
    id: string;
    type: 'note' | 'voice' | 'link' | 'file' | 'image' | 'emotion';
    content: RecordContent;
    plain_text_content: string;
    tags: Tag[];
    created_at: Date;
    updated_at: Date;
  }
  ```

### Tag (標籤)

- **用途**: 用於組織和分類 Record。
- **關鍵屬性**:
  - `id`: 唯一標識符
  - `name`: 標籤名稱

- **關係**:
  - 與 Record 是多對多關係。

- **TypeScript 接口** (`packages/shared/src/types/tag.ts`)

  ```typescript
  export interface Tag {
    id: string;
    name: string;
  }
  ```

---

## 五、API 規範 (API Specification)

我們將使用 GraphQL 作為客戶端與後端服務之間的主要通信協議。這份 Schema 定義了我們的後端服務需要暴露給客戶端的數據和能力，主要集中在用戶認證和加密數據同步上。

### GraphQL Schema

```graphql
# 標量類型定義
scalar DateTime
scalar JSONObject

# 用戶相關類型
type User {
    id: ID!
    email: String!
    subscriptionStatus: SubscriptionStatus!
    createdAt: DateTime!
}

enum SubscriptionStatus {
    FREE
    PRO
}

type AuthPayload {
    token: String!
    user: User!
}

# 數據同步相關類型
# 注意：'data' 字段是一個加密的字符串，後端無法解讀其內容。
type EncryptedRecord {
    id: ID! # 本地記錄的ID
    encryptedData: String! # 加密後的 Record 數據
    version: Int! # 用於衝突解決的版本號
    updatedAt: DateTime!
}

# 根查詢類型
type Query {
    "獲取當前已認證用戶的信息"
    me: User
}

# 根變更類型
type Mutation {
    "用戶註冊"
    register(email: String!, password: String!): AuthPayload!

    "用戶登錄"
    login(email: String!, password: String!): AuthPayload!

    "（示例）上傳一批加密的記錄數據以進行同步"
    syncRecords(records: [EncryptedRecordInput!]!): [EncryptedRecord!]!

    "（示例）從上次同步點獲取服務器上更新的加密記錄"
    fetchUpdates(sinceVersion: Int!): [EncryptedRecord!]!
}

# 輸入類型
input EncryptedRecordInput {
    id: ID!
    encryptedData: String!
    version: Int!
}
```

---

## 六、組件 (Components)

### 客戶端應用 (Client App - packages/app)

#### UI 層 (UI Layer)

- **職責**: 負責應用的所有可視界面。使用 React Native Paper 組件庫構建，並遵循原子設計模式，將界面拆分為原子、分子、組織等可複用的組件。
- **關鍵接口**: 接收來自狀態管理層的數據進行渲染，並將用戶交互事件分發給業務邏輯層。
- **依賴**: 狀態管理層 (Zustand), 業務邏輯層。

#### 狀態管理層 (State Management Layer)

- **職責**: 使用 Zustand 管理全局UI狀態，例如當前主題（淺色/深色）、用戶登錄狀態、加載指示器等。業務數據的狀態由數據層直接管理。
- **關鍵接口**: 提供簡單的 hooks 供UI層讀取和更新狀態。
- **依賴**: 無。

#### 業務邏輯/服務層 (Service Layer)

- **職責**: 封裝核心業務邏輯，例如數據加密、處理用戶輸入、調用 AI 服務等。
- **關鍵接口**: 提供給UI層和數據同步服務調用的方法。
- **依賴**: 數據層 (WatermelonDB), AI 服務層。

#### 數據層 (Data Layer)

- **職責**: 使用 WatermelonDB 實現所有本地數據的 CRUD (增刪改查) 操作。它將是應用的“真理之源”。
- **關鍵接口**: 提供響應式的數據查詢接口，當數據變化時，UI 會自動更新。
- **依賴**: WatermelonDB。

#### 數據同步服務 (Data Sync Service)

- **職責**: 在後台運行，監聽本地數據庫的變化，將變更進行加密，並通過 GraphQL API 推送到後端。同時，它也負責從後端拉取更新並應用到本地數據庫。
- **關鍵接口**: `pushChanges()`, `pullChanges()`。
- **依賴**: 數據層, 後端 API 服務。

#### AI 服務層 (AI Service Layer)

- **職責**: 根據用戶在設置中配置的 API Key，管理與第三方 AI 服務的通信。所有AI相關的網絡請求都由此層發出。
- **關鍵接口**: `getTranscription(audio)`, `getSummary(text)` 等。
- **依賴**: 用戶配置, 第三方 AI API。

### 後端服務 (Backend Server - packages/server)

#### API 層 (API Layer)

- **職責**: 使用 FastAPI 和 Graphene-Python 實現 GraphQL API。負責解析客戶端的請求，並將其路由到相應的服務進行處理。
- **關鍵接口**: GraphQL Endpoint。
- **依賴**: 認證服務, 同步服務。

#### 認證服務 (Auth Service)

- **職責**: 處理用戶註冊、登錄、密碼管理和 JWT (Token) 的簽發與驗證。
- **關鍵接口**: `registerUser()`, `loginUser()`, `verifyToken()`。
- **依賴**: 數據庫層。

#### 同步服務 (Sync Service)

- **職責**: 接收客戶端上傳的加密數據包，並將其存儲在 PostgreSQL 中。同時，它也處理客戶端獲取更新的請求。它不關心數據內容，只負責存儲和檢索。
- **關鍵接口**: `handleSyncPush()`, `handleSyncPull()`。
- **依賴**: 數據庫層。

#### 數據庫層 (Database Layer)

- **職責**: 使用 SQLAlchemy (Python ORM) 管理與 PostgreSQL 數據庫的交互，只涉及 User 表和 EncryptedRecords 表。
- **關鍵接口**: `getUserByEmail()`, `saveRecords()` 等。
- **依賴**: PostgreSQL。

### 共享包 (Shared Package - packages/shared)

- **職責**: 存放所有前後端共享的代碼，主要是 TypeScript 的類型定義（如 User, Record, Tag 接口），以及可能的共享工具函數。
- **關鍵接口**: 導出的 TypeScript 類型和函數。
- **依賴**: 無。

---

## 七、統一項目結構 (Unified Project Structure)

我們將採用 Monorepo 結構來組織我們的代碼庫，使用 npm workspaces 或類似工具（如 pnpm workspaces）進行管理。

```
/monorepo-root
|
|-- /packages
|   |
|   |-- /app (客戶端應用 - React Native)
|   |   |-- /src
|   |   |   |-- /components       # 可複用的UI組件 (原子、分子)
|   |   |   |-- /screens          # 屏幕級組件 (組織、頁面)
|   |   |   |-- /services         # 業務邏輯、AI、同步服務
|   |   |   |-- /database         # WatermelonDB schema 和模型定義
|   |   |   |-- /navigation       # 導航棧和路由
|   |   |   |-- /store            # Zustand 狀態管理
|   |   |   |-- /hooks            # 自定義 React Hooks
|   |   |   `-- /assets           # 圖片、字體等資源
|   |   |-- index.js              # 應用入口
|   |   |-- package.json
|   |
|   |-- /server (後端服務 - FastAPI)
|   |   |-- /app
|   |   |   |-- /api              # GraphQL API 解析器和路由
|   |   |   |-- /services         # 認證、同步等服務
|   |   |   |-- /models           # SQLAlchemy 數據庫模型
|   |   |   |-- /core             # 核心配置、依賴注入
|   |   |   `-- main.py           # 應用入口
|   |   |-- requirements.txt      # Python 依賴
|   |   `-- Dockerfile            # (可選) 容器化配置
|   |
|   `-- /shared (共享代碼 - TypeScript)
|       |-- /src
|       |   `-- /types            # 所有共享的 TypeScript 接口
|       `-- package.json
|
|-- package.json                  # Monorepo 根配置
|-- tsconfig.json                 # 全局 TypeScript 配置
`-- .gitignore
```

---

## 八、開發工作流程與環境 (Development Workflow & Environment)

### 本地開發設置

- **環境要求**:
  - Node.js (~18.x 或更高)
  - Python (~3.10 或更高)
  - 配置好 React Native 開發環境 (Xcode for iOS, Android Studio for Android)
  - Docker (用於本地 PostgreSQL 數據庫)

- **啟動步驟**:
  1. 根目錄運行 `npm install` 來安裝所有客戶端依賴。
  2. `packages/server` 目錄下運行 `pip install -r requirements.txt` 安裝後端依賴。
  3. 通過 Docker 啟動一個本地 PostgreSQL 實例。
  4. 在根目錄下運行 `npm run dev` 腳本，該腳本將同時啟動客戶端 Metro Bundler 和後端 FastAPI 服務。

### 分支策略 (Branching Strategy)

- `main`: 主分支，始終保持可部署的生產狀態。
- `develop`: 開發分支，集成了所有已完成的功能，是新功能分支的基礎。
- `feature/<story-id>`: 功能分支，每個用戶故事都在自己的分支上進行開發（例如 `feature/1.2-user-auth`）。
- `fix/<issue-id>`: 修復分支，用於修復生產環境的緊急問題。

---

## 九、測試策略 (Testing Strategy)

我們將採用測試金字塔模型，確保代碼質量和系統穩定性。

### 單元測試 (Unit Tests)

- **範圍**: 測試單個函數、組件或類的邏輯。
- **客戶端**: 使用 Jest 和 React Native Testing Library 測試 React 組件和業務邏輯。
- **後端**: 使用 Pytest 測試 FastAPI 中的服務和工具函數。
- **目標**: 覆蓋所有關鍵業務邏輯和邊界條件。

### 集成測試 (Integration Tests)

- **範圍**: 測試多個組件之間的交互。
- **客戶端**: 測試屏幕與其依賴的服務之間的交互，確保數據流正確。
- **後端**: 測試 API 層與服務層、數據庫層的集成，驗證 GraphQL API 的行為是否符合預期。
- **目標**: 確保系統的各個部分能夠正確協同工作。

### 端到端測試 (End-to-End Tests)

- **範圍**: 模擬真實用戶場景，從 UI 操作到後端處理再到數據庫存儲的完整流程。
- **工具**: 使用 Detox 或 Maestro 進行移動端的 E2E 測試。
- **目標**: 驗證核心用戶故事（如註冊、創建筆記、同步）在真實環境中的正確性。

---

## 十、安全考量 (Security Considerations)

### 認證與授權 (Authentication & Authorization)

- **密碼安全**: 後端絕不存儲明文密碼，所有密碼都將使用 bcrypt 進行哈希處理。
- **令牌 (Token)**: 認證將基於 JWT (JSON Web Tokens)。登錄成功後，後端簽發一個短生命週期的 access_token 和一個長生命週期的 refresh_token。
- **API 保護**: 所有需要用戶身份的 GraphQL 操作都將通過 JWT 進行保護。

### 數據隱私 (Data Privacy)

- **端到端加密 (E2EE)**: 這是我們安全模型的核心。所有 Record 數據在離開客戶端之前，都將使用強加密算法（如 AES-256）進行加密。加密密鑰由用戶密碼派生，並且 永遠不會 發送到服務器。
- **後端無知**: 後端服務對於用戶存儲的數據內容是完全無知的，它只存儲和同步加密後的數據塊。

### 通信安全 (Communication Security)

- 所有客戶端與後端之間的通信都必須使用 HTTPS/TLS 進行加密。

---

## 十一、部署與運維 (Deployment & Operations)

### 持續集成/持續部署 (CI/CD)

- **工具**: 使用 GitHub Actions。
- **流程**:
  1. 當 feature 分支推送到遠程倉庫時，自動運行 lint 檢查和單元測試。
  2. 當 feature 分支合併到 develop 時，觸發構建並部署到 預覽 (Staging) 環境。
  3. 當 develop 分支合併到 main 時，觸發構建並部署到 生產 (Production) 環境。

### 環境 (Environments)

- **開發 (Development)**: 開發人員的本地機器。
- **預覽 (Staging)**: 一個類似生產的環境，用於在發布前進行 E2E 測試和最終驗證。
- **生產 (Production)**: 面向最終用戶的實時環境。

### 基礎設施 (Infrastructure)

- **後端**: 部署為無服務器應用（Serverless），例如 Google Cloud Run 或 AWS Lambda，以實現自動擴展和成本效益。
- **數據庫**: 使用雲服務商提供的託管 PostgreSQL 服務（如 Google Cloud SQL 或 Amazon RDS）。

### 監控與日誌 (Monitoring & Logging)

- **日誌**: 在後端，所有請求和錯誤都將被結構化地記錄下來，並發送到一個集中的日誌管理系統（如 Google Cloud Logging）。
- **監控**: 監控關鍵性能指標（如 API 響應時間、錯誤率、數據庫連接數），並設置警報。