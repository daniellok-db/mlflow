import type { TimelineTreeNode } from './timeline-tree';

export const MLFLOW_TRACE_SCHEMA_VERSION_KEY = 'mlflow.trace_schema.version';

// column name for mlflow trace data in inference tables
export const INFERENCE_TABLE_RESPONSE_COLUMN_KEY = 'response';
export const INFERENCE_TABLE_TRACE_COLUMN_KEY = 'trace';

export enum ModelSpanType {
  LLM = 'LLM',
  CHAIN = 'CHAIN',
  AGENT = 'AGENT',
  TOOL = 'TOOL',
  FUNCTION = 'FUNCTION',
  CHAT_MODEL = 'CHAT_MODEL',
  RETRIEVER = 'RETRIEVER',
  PARSER = 'PARSER',
  EMBEDDING = 'EMBEDDING',
  RERANKER = 'RERANKER',
  UNKNOWN = 'UNKNOWN',
}

export enum ModelIconType {
  MODELS = 'models',
  DOCUMENT = 'document',
  CONNECT = 'connect',
  SEARCH = 'search',
  SORT = 'sort',
  UNKNOWN = 'unknown',
  FUNCTION = 'function',
  CODE = 'code',
  NUMBERS = 'numbers',
  WRENCH = 'wrench',
  AGENT = 'agent',
  CHAIN = 'chain',
}

/**
 * Represents a single model trace span.
 * Based on https://github.com/mlflow/mlflow/blob/tracing/mlflow/entities/span.py
 *
 * TODO: clean up all deprecated fields after PrPr customers swap over to
 *       the latest version of mlflow tracing
 */
export type ModelTraceSpan = {
  context: {
    span_id: string;
    trace_id: string;
  };
  name: string;
  /* deprecated, renamed to `parent_id` */
  parent_span_id?: string | null;
  parent_id?: string | null;
  /* deprecated, contained in attributes['mlflow.spanType'] */
  span_type?: ModelSpanType | string;
  /* deprecated, migrated to `status_code` and `status_message` */
  status?: ModelTraceStatus;
  status_code?: string;
  status_message?: string | null;
  start_time: number;
  end_time: number;
  /* deprecated, contained in attributes['mlflow.spanInputs'] */
  inputs?: any;
  /* deprecated, contained in attributes['mlflow.spanOutputs'] */
  outputs?: any;
  attributes?: Record<string, any>;
  events?: ModelTraceEvent[];
  /* metadata for ui usage logging */
  type: ModelSpanType;
};

export type ModelTraceEvent = {
  name: string;
  timestamp?: number;
  attributes?: Record<string, any>;
};

export type ModelTraceData = {
  spans: ModelTraceSpan[];
};

/**
 * Represents a single model trace object.
 * Based on https://github.com/mlflow/mlflow/blob/8e44d102e9568d09d9dc376136d13a5a5d1ab46f/mlflow/tracing/types/model.py#L11
 */
export type ModelTrace = {
  /* deprecated, renamed to `data` */
  trace_data?: ModelTraceData;
  /* deprecated, renamed to `info` */
  trace_info?: ModelTraceInfo;
  data: ModelTraceData;
  info: ModelTraceInfo | NotebookModelTraceInfo;
};

/**
 * Represents the trace data saved in an inference table.
 * https://github.com/databricks/universe/blob/fb8a572602161aa6387ac32593aa24a91518cc32/rag/serving/python/databricks/rag/unpacking/schemas.py#L133-L141
 */
export type ModelTraceInferenceTableData = {
  app_version_id: string;
  start_timestamp: string;
  end_timestamp: string;
  is_truncated: boolean;
  [MLFLOW_TRACE_SCHEMA_VERSION_KEY]: number;
  spans: (Omit<ModelTraceSpan, 'attributes'> & {
    attributes: string;
  })[];
};

export type ModelTraceInfo = {
  request_id?: string;
  experiment_id?: string;
  timestamp_ms?: number;
  execution_time_ms?: number;
  status?: ModelTraceStatus['description'];
  attributes?: Record<string, any>;
  request_metadata?: { key: string; value: string }[];
  tags?: { key: string; value: string }[];
};

// tags and request_metadata in the notebook view
// (i.e. displayed directly from the python client)
// are stored as an object rather than an array.
export type NotebookModelTraceInfo = Omit<ModelTraceInfo, 'tags' | 'request_metadata'> & {
  tags?: { [key: string]: string };
  request_metadata?: { [key: string]: string };
};

export type ModelTraceStatusUnset = {
  description: 'UNSET';
  status_code: 0;
};

export type ModelTraceStatusOk = {
  description: 'OK';
  status_code: 1;
};

export type ModelTraceStatusError = {
  description: 'ERROR';
  status_code: 2;
};

export type ModelTraceStatusInProgress = {
  description: 'IN_PROGRESS';
  status_code: 3;
};

export enum ModelTraceSpanType {
  LLM = 'LLM',
  CHAIN = 'CHAIN',
  AGENT = 'AGENT',
  TOOL = 'TOOL',
  CHAT_MODEL = 'CHAT_MODEL',
  RETRIEVER = 'RETRIEVER',
  PARSER = 'PARSER',
  EMBEDDING = 'EMBEDDING',
  RERANKER = 'RERANKER',
  UNKNOWN = 'UNKNOWN',
}

export type ModelTraceStatus =
  | ModelTraceStatusUnset
  | ModelTraceStatusOk
  | ModelTraceStatusError
  | ModelTraceStatusInProgress;

/**
 * Represents a single node in the model trace tree.
 */
export interface ModelTraceSpanNode
  extends TimelineTreeNode,
    Pick<ModelTraceSpan, 'inputs' | 'outputs' | 'attributes' | 'type' | 'events'> {
  children?: ModelTraceSpanNode[];
}

export type ModelTraceExplorerTab = 'content' | 'attributes' | 'events';

export type SearchMatch = {
  span: ModelTraceSpanNode;
  section: 'inputs' | 'outputs' | 'attributes' | 'events';
  key: string;
  isKeyMatch: boolean;
  matchIndex: number;
};

export interface RetrieverDocument {
  metadata: {
    doc_uri: string;
    chunk_id: string;
    [key: string]: any;
  };
  page_content: string;
  [key: string]: any;
}

export enum CodeSnippetRenderMode {
  JSON = 'json',
  TEXT = 'text',
  MARKDOWN = 'markdown',
}

export type ModelTraceChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool' | 'function';
  content: string | null;
  tool_calls?: ModelTraceToolCall[];
  tool_call_id?: string;
};

export type ModelTraceToolCall = {
  id: string;
  function: {
    arguments: string;
    name: string;
  };
};

// aligned to the OpenAI format
export type ModelTraceChatResponse = {
  choices: {
    message: ModelTraceChatMessage;
  }[];
};

export type LlamaIndexChatResponse = {
  message: ModelTraceChatMessage;
};

export type ModelTraceChatInput = {
  messages: ModelTraceChatMessage[];
};

// it has other fields, but we only care about these for now
export type LangchainBaseMessage = {
  content: string;
  type: 'human' | 'user' | 'assistant' | 'ai' | 'system' | 'tool' | 'function';
  tool_calls?: LangchainToolCallMessage[];
  tool_call_id?: string;
  additional_kwargs?: {
    // some langchain models have tool_calls specified in additional_kwargs in
    // OpenAI format. this appears to be a bug, but we should still try to handle it
    tool_calls?: ModelTraceToolCall[];
  };
};

export type LangchainToolCallMessage = {
  name: string;
  // an object with the arguments to the tool call.
  // should be stringified before display.
  args: any;
  id: string;
};

export type LangchainChatGeneration = {
  message: LangchainBaseMessage;
};
