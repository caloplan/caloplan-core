import type { PaginatedResponse } from "./common.js";
import type {
  CreateEntryParams,
  GetEntryOptions,
  MetadataEntry,
  QueryEntriesParams,
  UpdateEntryParams,
} from "./entry.js";

/**
 * Repository 依赖的 entries 客户端最小契约。
 * 外部 MetaSDK 实例（含完整实现）满足此结构即可注入，本库不包含 SDK 实现。
 */
export interface EntriesClient {
  create(params: CreateEntryParams): Promise<MetadataEntry>;
  get(
    typeName: string,
    entityKey: string,
    options?: GetEntryOptions,
  ): Promise<MetadataEntry>;
  update(
    typeName: string,
    entityKey: string,
    params: UpdateEntryParams,
  ): Promise<MetadataEntry>;
  delete(typeName: string, entityKey: string): Promise<void>;
  query(params: QueryEntriesParams): Promise<PaginatedResponse<MetadataEntry>>;
}

/** Repository 依赖的 MetaSDK 最小结构契约 */
export interface MetaSdkLike {
  entries: EntriesClient;
}

/** SDK 错误的结构化形状：本库不依赖具体错误类，按字段判断（如 statusCode === 404） */
export interface SdkErrorLike {
  statusCode?: number;
}
