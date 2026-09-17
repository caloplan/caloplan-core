# caloplan-core

CaloPlan 前端核心业务模块（纯 TypeScript + ESM）——领域模型 / 实体工厂 / 仓储 / meta-sdk 契约。

## 定位与边界

- 承载食物、餐食、营养计算的**领域模型与仓储**，供各前端（RN Web / 后续客户端）复用。
- **不直接操作 HTTP**：`sdk/meta-sdk` 只定义 `EntriesClient` 契约（接口），HTTP 实现由上层注入（如 `coloplan-v2/src/sdk/meta-sdk`）。
- **不直接操作 localStorage**：缓存经 `caloplan-cache` 注入。
- **不实现登录 / Token**：由上层注入 `userIdProvider` 与已登录的 SDK。

## 架构

```
src/
  cpcore.ts            createCPCore({ metaSdk, userIdProvider }) 主入口，暴露各仓储
  core/model           Meal / Food / Nutrition / Unit 领域模型（snake_case）
  core/entity          实体工厂：createMeal / createFood / createMealFood / 营养计算
  core/utils           营养计算 / 餐食结构转换
  repository           MealRespository / FoodRespository（数据访问，含 log-decorator 代理）
  proxy                仓储调用日志装饰器
  sdk/meta-sdk         EntriesClient 契约（types/contract.ts / entry.ts / type.ts），无 HTTP 实现
```

## 数据契约（重要）

### 字段命名

| 层 | 命名 | 示例 |
| --- | --- | --- |
| 领域模型 | snake_case | `Meal.user_id` / `created_time` |
| 存储 data（`toMealData` 序列化） | camelCase | `userId` / `createdTime` |
| **实际落库** | **snake_case** | `user_id` / `created_time` |
| 查询 filters | **snake_case** | `{ user_id, created_time }` |

> 落库字段经上层 meta-sdk 的 `create` / `update` 做 `camelToSnake` 转换；
> 查询 filters 必须与**落库字段名**一致（snake_case），而非 schema 文档的 camelCase 名。

### 时间戳约定（createdTime 存日期）

- Meal / Food 的 `createdTime` 落库统一存 **`yyyy-mm-dd`**（`toDateOnly`：ISO 字符串 `slice(0, 10)`）。
- 目的：meta 服务端按**业务日期**精确过滤（`json_extract(data, '$.created_time') == '2026-09-16'`），
  避免按 entry 存储时间（created_at）范围过滤带来的偏差。
- 查询：`listMine({ date: 'yyyy-mm-dd' })` → `filters.created_time = date`。

### meta 服务端查询边界

- `field_filters` 实现为 `json_extract(data, '$.<field>') == value`（**等值匹配**）。
- 所有**标量 string / number** 字段可过滤：`user_id` / `created_time` / `type` / `tips` / `id` 等。
- **嵌套 dict / array**（`foods` / `nutrition`）不能等值过滤；**无模糊 / 范围 / 前缀匹配**。

## 仓储 API（摘要）

| 仓储 | 方法 | 说明 |
| --- | --- | --- |
| `MealRespository` | `listMine(options?: { date?: string })` | 当前用户餐食；传 `date` 时按 `created_time = yyyy-mm-dd` 精确查当天 |
| | `getById(id)` / `create(input)` / `update(id, patch)` / `deleteById(id)` | 餐食 CRUD |
| `FoodRespository` | `listMine()` / `create(input)` 等 | 食物库 CRUD |

## 开发

```bash
pnpm install
pnpm test        # node:test + tsx（40 用例）
pnpm build       # tsc -p tsconfig.build.json → dist/
pnpm typecheck   # tsc --noEmit
```

> 更新 `file:` 依赖方（如 coloplan-v2）后需重新 `pnpm install` 同步 `.pnpm` 副本，
> 并清理 `node_modules/.vite` 后重启 dev server，避免预构建缓存旧 dist。
