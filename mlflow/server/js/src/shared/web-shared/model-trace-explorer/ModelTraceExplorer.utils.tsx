import {
  isNil,
  omitBy,
  mapValues,
  isArray,
  isString,
  isNumber,
  isBoolean,
  escapeRegExp,
  map,
  every,
  has,
  compact,
} from 'lodash';

import { ModelSpanType, ModelIconType, MLFLOW_TRACE_SCHEMA_VERSION_KEY } from './ModelTrace.types';
import type {
  SearchMatch,
  ModelTrace,
  ModelTraceSpan,
  ModelTraceSpanNode,
  ModelTraceChatMessage,
  LangchainChatGeneration,
  LangchainBaseMessage,
  ModelTraceChatResponse,
  ModelTraceChatInput,
  LlamaIndexChatResponse,
  LangchainToolCallMessage,
  ModelTraceToolCall,
} from './ModelTrace.types';
import { ModelTraceExplorerIcon } from './ModelTraceExplorerIcon';
import { safex } from '../flags';

function getIconTypeForSpan(spanType: ModelSpanType | string): ModelIconType {
  switch (spanType) {
    case ModelSpanType.LLM:
      return ModelIconType.MODELS;
    case ModelSpanType.CHAIN:
      return ModelIconType.CHAIN;
    case ModelSpanType.AGENT:
      return ModelIconType.AGENT;
    case ModelSpanType.TOOL:
      return ModelIconType.WRENCH;
    case ModelSpanType.CHAT_MODEL:
      return ModelIconType.MODELS;
    case ModelSpanType.RETRIEVER:
      return ModelIconType.SEARCH;
    case ModelSpanType.PARSER:
      return ModelIconType.CODE;
    case ModelSpanType.EMBEDDING:
      return ModelIconType.NUMBERS;
    case ModelSpanType.RERANKER:
      return ModelIconType.SORT;
    case ModelSpanType.FUNCTION:
      return ModelIconType.FUNCTION;
    case ModelSpanType.UNKNOWN:
      return ModelIconType.UNKNOWN;
    default:
      return ModelIconType.FUNCTION;
  }
}

export function tryDeserializeAttribute(value: string): any {
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
}

export const getMatchesFromEvent = (span: ModelTraceSpanNode, searchFilter: string): SearchMatch[] => {
  const events = span.events;
  if (!events) {
    return [];
  }

  const matches: SearchMatch[] = [];
  events.forEach((event, index) => {
    const attributes = event.attributes;

    if (!attributes) {
      return;
    }

    Object.keys(attributes).forEach((attribute) => {
      const isKeyMatch = attribute.toLowerCase().includes(searchFilter);
      const key = getEventAttributeKey(event.name, index, attribute);

      if (isKeyMatch) {
        matches.push({
          span,
          section: 'events',
          key,
          isKeyMatch: true,
          matchIndex: 0,
        });
      }

      // event values can be arbitrary JSON
      const value = JSON.stringify(attributes[attribute]).toLowerCase();
      const numValueMatches = value.split(searchFilter).length - 1;
      for (let i = 0; i < numValueMatches; i++) {
        matches.push({
          span,
          section: 'events',
          key,
          isKeyMatch: false,
          matchIndex: i,
        });
      }
    });
  });

  return matches;
};

/**
 * This function extracts all the matches from a span based on the search filter,
 * and appends some necessary metadata that is necessary for the jump-to-search
 * function.
 */
export const getMatchesFromSpan = (span: ModelTraceSpanNode, searchFilter: string): SearchMatch[] => {
  const matches: SearchMatch[] = [];

  const sections = {
    inputs: span?.inputs,
    outputs: span?.outputs,
    attributes: span?.attributes,
    events: span?.events,
  };

  map(sections, (section: any, label: 'inputs' | 'outputs' | 'attributes' | 'events') => {
    if (label === 'events') {
      matches.push(...getMatchesFromEvent(span, searchFilter));
      return;
    }

    const sectionList = createListFromObject(section);
    sectionList.forEach((item) => {
      // NOTE: this ignores the fact that there might be multiple matches in a key
      // for example, if the key is "aaaaa", and the search filter is "a". However,
      // implementing support for this case would make the code needlessly complex.
      // If we receive feedback that this is a problem, we can revisit this.
      const isKeyMatch = item.key.toLowerCase().includes(searchFilter);
      if (isKeyMatch) {
        matches.push({
          span: span,
          section: label,
          key: item.key,
          isKeyMatch: true,
          matchIndex: 0,
        });
      }

      const numValueMatches = item.value.toLowerCase().split(searchFilter).length - 1;
      for (let i = 0; i < numValueMatches; i++) {
        matches.push({
          span: span,
          section: label,
          key: item.key,
          isKeyMatch: false,
          matchIndex: i,
        });
      }
    });
  });
  return matches;
};

export function searchTree(
  rootNode: ModelTraceSpanNode,
  searchFilter: string,
): {
  filteredTreeNodes: ModelTraceSpanNode[];
  matches: SearchMatch[];
} {
  // if the search filter is empty, return the root node
  // and an empty list of matches since the user isn't really
  // searching for anything.
  const searchFilterLowercased = searchFilter.toLowerCase().trim();
  if (searchFilterLowercased === '') {
    return {
      filteredTreeNodes: [rootNode],
      matches: [],
    };
  }

  const children = rootNode.children ?? [];
  const filteredChildren: ModelTraceSpanNode[] = [];
  const matches: SearchMatch[] = [];
  children.forEach((child) => {
    const { filteredTreeNodes: childNodes, matches: childMatches } = searchTree(child, searchFilterLowercased);

    filteredChildren.push(...childNodes);
    matches.push(...childMatches);
  });

  const spanName = ((rootNode.title as string) ?? '').toLowerCase();
  const spanMatches = getMatchesFromSpan(rootNode, searchFilterLowercased);

  // still show the node if the name matches the search filter,
  // even if its contents don't have any matches.
  if (spanMatches.length === 0 && !spanName.includes(searchFilterLowercased)) {
    return {
      filteredTreeNodes: filteredChildren,
      matches,
    };
  }

  return {
    filteredTreeNodes: [{ ...rootNode, children: filteredChildren }],
    matches: spanMatches.concat(matches),
  };
}

const normalizeNewSpanData = (
  span: ModelTraceSpan,
  rootStartTime: number,
  rootEndTime: number,
  children: ModelTraceSpanNode[],
): ModelTraceSpanNode => {
  const spanType = tryDeserializeAttribute(span.attributes?.['mlflow.spanType']);
  const inputs = tryDeserializeAttribute(span.attributes?.['mlflow.spanInputs']);
  const outputs = tryDeserializeAttribute(span.attributes?.['mlflow.spanOutputs']);
  const attributes = mapValues(
    omitBy(span.attributes, (_, key) => key.startsWith('mlflow.')),
    (value) => tryDeserializeAttribute(value),
  );
  const events = span.events;
  const start = (Number(span.start_time) - rootStartTime) / 1000;
  const end = (Number(span.end_time ?? rootEndTime) - rootStartTime) / 1000;

  return {
    title: span.name,
    icon: <ModelTraceExplorerIcon type={getIconTypeForSpan(spanType)} />,
    type: spanType,
    key: span.context.span_id,
    start,
    end,
    children,
    inputs,
    outputs,
    attributes,
    events,
  };
};

export function parseModelTraceToTree(trace: ModelTrace): ModelTraceSpanNode | null {
  const spans = trace.trace_data?.spans ?? trace.data.spans;
  const spanMap: { [span_id: string]: ModelTraceSpan } = {};
  const relationMap: { [span_id: string]: string[] } = {};

  spans.forEach((span) => {
    spanMap[span.context.span_id] = span;
    relationMap[span.context.span_id] = [];
  });

  spans.forEach((span) => {
    const parentId = span.parent_span_id ?? span.parent_id;
    if (!isNil(parentId)) {
      if (!relationMap[parentId]) {
        throw new Error('Tree structure is malformed!');
      }
      relationMap[parentId].push(span.context.span_id);
    }
  });

  const rootSpan = spans.find((span) => isNil(span.parent_span_id ?? span.parent_id));
  if (isNil(rootSpan)) {
    return null;
  }

  function getSpanNodeFromData(span_id: string): ModelTraceSpanNode {
    const span = spanMap[span_id];
    const rootStart = Number(rootSpan?.start_time ?? 0);
    const rootEnd = Number(rootSpan?.end_time ?? 0);
    const children = relationMap[span_id].map(getSpanNodeFromData);

    // TODO: switch exclusively to this new function once
    //       all PrPr customers switch to the latest version
    //       of mlflow tracing

    // specifically check for `undefined`, because
    // parent_span will be `null` for the root span.
    const isOtelCompatibleSpan = span.parent_id !== undefined;
    if (isOtelCompatibleSpan) {
      return normalizeNewSpanData(span, rootStart, rootEnd, children);
    }

    const spanType = span.span_type ?? ModelSpanType.UNKNOWN;
    return {
      title: span.name,
      icon: <ModelTraceExplorerIcon type={getIconTypeForSpan(spanType)} />,
      type: spanType as ModelSpanType,
      key: span.context.span_id,
      start: Number(span.start_time) - rootStart,
      // default to the end of the root span if the span has no end time.
      // this can happen if an exception was thrown in the span.
      end: Number(span.end_time ?? rootEnd) - rootStart,
      children: children,
      inputs: span.inputs,
      outputs: span.outputs,
      attributes: span.attributes,
      events: span.events,
    };
  }

  return getSpanNodeFromData(rootSpan.context.span_id);
}

export function getIsMlflowTraceUIEnabled(): boolean {
  return (safex('mlflow_tracing', null) as boolean) ?? safex('databricks.fe.mlflow.enableTracingUI', false);
}

// this function attempts to extract the trace version from
// a given source (either request_metadata or tags)
export function findTraceVersionByKey(
  source: { [key: string]: string } | { key: string; value: string }[] | undefined,
): string | undefined {
  if (!source) {
    return undefined;
  }

  if (isArray(source)) {
    return source.find((tag) => tag.key === MLFLOW_TRACE_SCHEMA_VERSION_KEY)?.value;
  }

  return source[MLFLOW_TRACE_SCHEMA_VERSION_KEY];
}

// this function determines whether an object is a ModelTrace by asserting
// that the object has the `data` and `info` fields, and that the
// trace info contains the `mlflow.trace_schema.version` key
export const isModelTrace = (trace: any): trace is ModelTrace => {
  const traceInfo = trace?.info;
  const traceData = trace?.data;
  if (!traceInfo || !traceData || !traceData?.spans) {
    return false;
  }

  const metadata = traceInfo?.request_metadata;
  if (metadata && findTraceVersionByKey(traceInfo.request_metadata)) {
    return true;
  }

  const tags = traceInfo?.tags;
  if (tags && findTraceVersionByKey(traceInfo.tags)) {
    return true;
  }

  return false;
};

export const createListFromObject = (
  obj: { [key: string]: any } | string[] | string | boolean | number | undefined,
) => {
  if (isNil(obj)) {
    return [];
  }

  if (Array.isArray(obj) || isString(obj) || isNumber(obj) || isBoolean(obj)) {
    return [{ key: '', value: JSON.stringify(obj, null, 2) }];
  }

  return Object.entries(obj).map(([key, value]) => {
    return { key, value: JSON.stringify(value, null, 2) };
  });
};

export const getHighlightedSpanComponents = ({
  searchFilter,
  data,
  activeMatchBackgroundColor,
  inactiveMatchBackgroundColor,
  containsActiveMatch,
  activeMatch,
  scrollToActiveMatch,
}: {
  searchFilter: string;
  data: string;
  activeMatchBackgroundColor: string;
  inactiveMatchBackgroundColor: string;
  containsActiveMatch: boolean;
  activeMatch: SearchMatch;
  scrollToActiveMatch: (node: HTMLSpanElement) => void;
}) => {
  // splitting by regex retains the matches in the array,
  // which makes it easier to handle stuff like preserving
  // the original case of the match.
  const regex = new RegExp(`(${escapeRegExp(searchFilter.trim())})`, 'gi');
  const parts = data.split(regex);
  const spans: React.ReactNode[] = [];
  let matchIndex = 0;

  for (let i = 0; i < parts.length; i++) {
    if (parts[i].toLowerCase().includes(searchFilter.toLowerCase().trim())) {
      const isActiveMatch = containsActiveMatch && activeMatch.matchIndex === matchIndex;
      const backgroundColor = isActiveMatch ? activeMatchBackgroundColor : inactiveMatchBackgroundColor;
      const span = (
        <span ref={isActiveMatch ? scrollToActiveMatch : null} key={i} css={{ backgroundColor, scrollMarginTop: 50 }}>
          {parts[i]}
        </span>
      );
      matchIndex++;
      spans.push(span);
    } else {
      spans.push(parts[i]);
    }
  }

  return spans;
};

export const isRenderableRetrieverSpan = (span: ModelTraceSpanNode): boolean => {
  return (
    span.type === ModelSpanType.RETRIEVER &&
    Array.isArray(span.outputs) &&
    span.outputs.length > 0 &&
    every(span.outputs, (document) => has(document, 'page_content'))
  );
};

export const getEventAttributeKey = (name: string, index: number, attribute: string): string => {
  return `${name}-${index}-${attribute}`;
};

export const getSpanExceptionCount = (span: ModelTraceSpanNode): number => {
  return (span.events ?? []).filter((event) => event.name === 'exception').length;
};

export const langchainMessageToModelTraceMessage = (message: LangchainBaseMessage): ModelTraceChatMessage | null => {
  let role: ModelTraceChatMessage['role'];
  switch (message.type) {
    case 'user':
    case 'human':
      role = 'user';
      break;
    case 'assistant':
    case 'ai':
      role = 'assistant';
      break;
    case 'system':
      role = 'system';
      break;
    case 'tool':
      role = 'tool';
      break;
    case 'function':
      role = 'function';
      break;
    default:
      return null;
  }

  const normalizedMessage: ModelTraceChatMessage = {
    content: message.content,
    role,
  };

  const toolCalls = message.tool_calls;
  const toolCallsFromKwargs = message.additional_kwargs?.tool_calls;

  // attempt to parse tool calls from the top-level field,
  // otherwise fall back to the additional_kwargs field if it exists
  if (
    !isNil(toolCalls) &&
    Array.isArray(toolCalls) &&
    toolCalls.length > 0 &&
    toolCalls.every(isLangchainToolCallMessage)
  ) {
    // compact for typing. the coercion should not fail since we
    // check that the type is correct in the if condition above
    normalizedMessage.tool_calls = compact(toolCalls.map(normalizeLangchainToolCall));
  } else if (
    !isNil(toolCallsFromKwargs) &&
    Array.isArray(toolCallsFromKwargs) &&
    toolCallsFromKwargs.length > 0 &&
    toolCallsFromKwargs.every(isModelTraceToolCall)
  ) {
    normalizedMessage.tool_calls = toolCallsFromKwargs.map(prettyPrintToolCall);
  }

  if (!isNil(message.tool_call_id)) {
    normalizedMessage.tool_call_id = message.tool_call_id;
  }

  return normalizedMessage;
};

export const normalizeLangchainToolCall = (toolCall: LangchainToolCallMessage): ModelTraceToolCall | null => {
  return {
    id: toolCall.id,
    function: {
      arguments: JSON.stringify(toolCall.args, null, 2),
      name: toolCall.name,
    },
  };
};

export const isModelTraceToolCall = (obj: any): obj is ModelTraceToolCall => {
  return obj && isString(obj.id) && isString(obj.function?.arguments) && isString(obj.function?.name);
};

export const isModelTraceChatMessage = (message: any): message is ModelTraceChatMessage => {
  return (
    message &&
    has(message, 'content') &&
    (message.role === 'user' || message.role === 'assistant' || message.role === 'system' || message.role === 'tool')
  );
};

export const isModelTraceChatInput = (obj: any): obj is ModelTraceChatInput => {
  return obj && Array.isArray(obj.messages) && obj.messages.length > 0 && obj.messages.every(isModelTraceChatMessage);
};

export const isModelTraceChatResponse = (obj: any): obj is ModelTraceChatResponse => {
  return (
    obj &&
    Array.isArray(obj.choices) &&
    obj.choices.length > 0 &&
    obj.choices.every((choice: any) => has(choice, 'message') && isModelTraceChatMessage(choice.message))
  );
};

export const isLangchainBaseMessage = (obj: any): obj is LangchainBaseMessage => {
  return (
    obj &&
    isString(obj.content) &&
    ['human', 'user', 'assistant', 'ai', 'system', 'tool', 'function'].includes(obj.type)
  );
};

export const isLangchainToolCallMessage = (obj: any): obj is LangchainToolCallMessage => {
  return obj && isString(obj.name) && has(obj, 'args') && isString(obj.id);
};

export const isLangchainChatGeneration = (obj: any): obj is LangchainChatGeneration => {
  return obj && isLangchainBaseMessage(obj.message);
};

export const isLlamaIndexChatResponse = (obj: any): obj is LlamaIndexChatResponse => {
  return obj && isModelTraceChatMessage(obj.message);
};

/**
 * Attempt to normalize a conversation, return null in case the format is unrecognized
 *
 * Supported formats:
 *   1. Langchain chat inputs
 *   2. Langchain chat results
 *   3. OpenAI chat inputs
 *   4. OpenAI chat responses
 *   5. LlamaIndex chat responses
 */
export const normalizeConversation = (input: any): ModelTraceChatMessage[] | null => {
  // if the input is already in the correct format, return it
  if (Array.isArray(input) && input.every(isModelTraceChatMessage)) {
    return input;
  }

  const langchainChatInput = normalizeLangchainChatInput(input);
  if (langchainChatInput) {
    return langchainChatInput;
  }

  const openAIChatInput = normalizeOpenAIChatInput(input);
  if (openAIChatInput) {
    return openAIChatInput;
  }

  const langchainChatResult = normalizeLangchainChatResult(input);
  if (langchainChatResult) {
    return langchainChatResult;
  }

  const openAIChatResponse = normalizeOpenAIChatResponse(input);
  if (openAIChatResponse) {
    return openAIChatResponse;
  }

  const llamaIndexChatResponse = normalizeLlamaIndexChatResponse(input);
  if (llamaIndexChatResponse) {
    return llamaIndexChatResponse;
  }

  return null;
};

// normalize langchain chat input format
export const normalizeLangchainChatInput = (obj: any): ModelTraceChatMessage[] | null => {
  // it could be a list of list of messages
  if (
    Array.isArray(obj) &&
    obj.length === 1 &&
    Array.isArray(obj[0]) &&
    obj[0].length > 0 &&
    obj[0].every(isLangchainBaseMessage)
  ) {
    const messages = obj[0].map(langchainMessageToModelTraceMessage);
    // if we couldn't convert all the messages, then consider the input invalid
    if (messages.some((message) => message === null)) {
      return null;
    }

    return messages as ModelTraceChatMessage[];
  }

  // it could also be an object with the `messages` key
  if (Array.isArray(obj?.messages) && obj.messages.length > 0 && obj.messages.every(isLangchainBaseMessage)) {
    const messages = obj.messages.map(langchainMessageToModelTraceMessage);

    if (messages.some((message: ModelTraceChatMessage[] | null) => message === null)) {
      return null;
    }

    return messages as ModelTraceChatMessage[];
  }

  return null;
};

// detect if an object is a langchain ChatResult, and normalize it to a list of messages
export const normalizeLangchainChatResult = (obj: any): ModelTraceChatMessage[] | null => {
  if (
    !Array.isArray(obj?.generations) ||
    !(obj.generations.length > 0) ||
    !obj.generations[0].every(isLangchainChatGeneration)
  ) {
    return null;
  }

  const messages: (ModelTraceChatMessage | null)[] = obj.generations[0].map((generation: LangchainChatGeneration) =>
    langchainMessageToModelTraceMessage(generation.message),
  );

  if (messages.some((message) => message === null)) {
    return null;
  }

  return messages as ModelTraceChatMessage[];
};

export const prettyPrintToolCall = (toolCall: ModelTraceToolCall): ModelTraceToolCall => {
  // add some spacing to the arguments for better readability
  let args = toolCall.function?.arguments;
  try {
    args = JSON.stringify(JSON.parse(args), null, 2);
  } catch (e) {
    // use original args
  }
  return {
    id: toolCall.id,
    function: {
      arguments: args,
      name: toolCall.function.name,
    },
  };
};

// normalize the OpenAI chat input format (object with 'messages' key)
export const normalizeOpenAIChatInput = (obj: any): ModelTraceChatMessage[] | null => {
  if (!isModelTraceChatInput(obj)) {
    return null;
  }

  // pretty-print the tool call args for display
  return obj.messages.map((message) => ({
    ...message,
    tool_calls: message.tool_calls?.map(prettyPrintToolCall),
  }));
};

// normalize the OpenAI chat response format (object with 'choices' key)
export const normalizeOpenAIChatResponse = (obj: any): ModelTraceChatMessage[] | null => {
  if (!isModelTraceChatResponse(obj)) {
    return null;
  }

  return obj.choices.map((choice) => ({
    ...choice.message,
    tool_calls: choice.message.tool_calls?.map(prettyPrintToolCall),
  }));
};

export const normalizeLlamaIndexChatResponse = (obj: any): ModelTraceChatMessage[] | null => {
  if (!isLlamaIndexChatResponse(obj)) {
    return null;
  }

  return [obj.message];
};
