import { ModelSpanType, type ModelTrace, type ModelTraceSpan } from './ModelTrace.types';

const commonSpanParts: Pick<ModelTraceSpan, 'span_type' | 'status' | 'events'> = {
  span_type: 'TEST',
  status: {
    description: 'OK',
    status_code: 1,
  },
  events: [],
};

export const MOCK_RETRIEVER_SPAN: ModelTraceSpan = {
  name: 'Retriever span',
  context: { span_id: 'retriever-span', trace_id: '12345' },
  type: ModelSpanType.RETRIEVER,
  start_time: 231205.888,
  end_time: 682486.272,
  inputs: 'tell me about python',
  outputs: [
    {
      page_content: 'Content with metadata',
      metadata: {
        chunk_id: '1',
        doc_uri: 'https://example.com',
        source: 'book-doc',
      },
    },
    {
      page_content: 'Content without metadata',
      metadata: {},
    },
  ],
  attributes: {},
};

export const MOCK_EVENTS_SPAN: ModelTraceSpan = {
  ...commonSpanParts,
  attributes: { function_name: 'top-level-attribute' },
  context: { span_id: 'events_span', trace_id: '1' },
  parent_span_id: null,
  name: 'events_span',
  start_time: 3.1 * 1e6,
  end_time: 8.1 * 1e6,
  inputs: { query: 'events_span-input' },
  outputs: { response: 'events_span-output' },
  type: ModelSpanType.FUNCTION,
  events: [
    {
      name: 'event1',
      attributes: {
        'event1-attr1': 'event-level-attribute',
        'event1-attr2': 'event1-attr2-value',
      },
    },
    {
      name: 'event2',
      attributes: {
        'event2-attr1': 'event2-attr1-value',
        'event2-attr2': 'event2-attr2-value',
      },
    },
  ],
};

export const mockSpans: ModelTraceSpan[] = [
  {
    ...commonSpanParts,
    attributes: { function_name: 'predict' },
    context: { span_id: 'document-qa-chain', trace_id: '1' },
    parent_span_id: null,
    name: 'document-qa-chain',
    start_time: 0 * 1e6,
    end_time: 25 * 1e6,
    inputs: { query: 'document-qa-chain-input' },
    outputs: { response: 'document-qa-chain-output' },
    type: ModelSpanType.CHAIN,
  },
  {
    ...commonSpanParts,
    attributes: { function_name: 'predict' },
    name: '_generate_response',
    context: { span_id: '_generate_response', trace_id: '1' },
    parent_span_id: 'document-qa-chain',
    start_time: 3 * 1e6,
    end_time: 8 * 1e6,
    inputs: { query: '_generate_response-input' },
    outputs: { response: '_generate_response-output' },
    type: ModelSpanType.CHAT_MODEL,
  },
  {
    ...commonSpanParts,
    attributes: { function_name: 'rephrase' },
    context: { span_id: 'rephrase_chat_to_queue', trace_id: '1' },
    parent_span_id: '_generate_response',
    name: 'rephrase_chat_to_queue',
    start_time: 8000000,
    end_time: 8500000,
    inputs: { query: 'rephrase_chat_to_queue-input' },
    outputs: { response: 'rephrase_chat_to_queue-output' },
    type: ModelSpanType.LLM,
  },
];

export const MOCK_TRACE: ModelTrace = {
  data: {
    spans: mockSpans,
  },
  info: {
    request_id: '1',
    experiment_id: '1',
    timestamp_ms: 1e9,
    execution_time_ms: 1e9,
    status: 'OK',
    tags: [],
    attributes: {},
  },
};

export const MOCK_LANGCHAIN_CHAT_INPUT = [
  [
    {
      content: "What's the weather in Singapore and New York?",
      additional_kwargs: {},
      response_metadata: {},
      type: 'human',
      name: null,
      id: null,
      example: false,
    },
    // tool call specified in additional_kwargs
    {
      content: '',
      additional_kwargs: {
        tool_calls: [
          {
            id: '1',
            function: {
              arguments: '{"city": "Singapore"}',
              name: 'get_weather',
            },
            type: 'function',
          },
        ],
        refusal: null,
      },
      type: 'ai',
      name: null,
      id: null,
      example: false,
    },
    // tool call specified in tool_calls
    {
      content: '',
      additional_kwargs: {},
      tool_calls: [
        {
          name: 'get_weather',
          args: {
            city: 'New York',
          },
          id: '2',
          type: 'tool_call',
        },
      ],
      type: 'ai',
      name: null,
      id: null,
      example: false,
    },
    // tool response
    {
      content: "It's hot in Singapore",
      additional_kwargs: {},
      response_metadata: {},
      type: 'tool',
      name: null,
      id: null,
      tool_call_id: '1',
      artifact: null,
      status: 'success',
    },
  ],
];

export const MOCK_LANGCHAIN_CHAT_OUTPUT = {
  generations: [
    [
      {
        text: 'The weather in Singapore is hot, while in New York, it is cold.',
        generation_info: {
          finish_reason: 'stop',
          logprobs: null,
        },
        type: 'ChatGeneration',
        message: {
          content: 'The weather in Singapore is hot, while in New York, it is cold.',
          additional_kwargs: {
            refusal: null,
          },
          response_metadata: {
            token_usage: {
              completion_tokens: 17,
              prompt_tokens: 156,
              total_tokens: 173,
              completion_tokens_details: {
                audio_tokens: null,
                reasoning_tokens: 0,
              },
              prompt_tokens_details: {
                audio_tokens: null,
                cached_tokens: 0,
              },
            },
            model_name: 'gpt-4o-mini-2024-07-18',
            system_fingerprint: 'fp_f59a81427f',
            finish_reason: 'stop',
            logprobs: null,
          },
          type: 'ai',
          name: null,
          id: 'run-2e7d781c-b478-4a70-b8bf-d2c4ee04878e-0',
        },
      },
    ],
  ],
  llm_output: {
    token_usage: {
      completion_tokens: 17,
      prompt_tokens: 156,
      total_tokens: 173,
      completion_tokens_details: {
        audio_tokens: null,
        reasoning_tokens: 0,
      },
      prompt_tokens_details: {
        audio_tokens: null,
        cached_tokens: 0,
      },
    },
    model_name: 'gpt-4o-mini-2024-07-18',
    system_fingerprint: 'fp_f59a81427f',
  },
  run: null,
  type: 'LLMResult',
};

export const MOCK_OPENAI_CHAT_INPUT = {
  model: 'gpt-4o-mini',
  messages: [
    {
      role: 'user',
      content: 'tell me a joke in 50 words',
    },
    {
      role: 'assistant',
      content: '',
      tool_calls: [
        {
          id: '1',
          function: {
            arguments: '{"joke_length": 50}',
            name: 'tell_joke',
          },
        },
      ],
    },
    {
      role: 'tool',
      content: 'Why did the scarecrow win an award? Because he was outstanding in his field!',
      tool_call_id: '1',
    },
  ],
  temperature: 0,
};

export const MOCK_OPENAI_CHAT_OUTPUT = {
  id: 'chatcmpl-A8HdoWt2DsJgtZoxjjAcPdx01jkul',
  choices: [
    {
      finish_reason: 'stop',
      index: 0,
      logprobs: null,
      message: {
        content: 'Why did the scarecrow win an award? Because he was outstanding in his field!',
        refusal: null,
        role: 'assistant',
        function_call: null,
        tool_calls: null,
      },
    },
  ],
  created: 1726537800,
  model: 'gpt-4o-mini-2024-07-18',
  object: 'chat.completion',
  service_tier: null,
  system_fingerprint: 'fp_483d39d857',
  usage: {
    completion_tokens: 68,
    prompt_tokens: 15,
    total_tokens: 83,
    completion_tokens_details: {
      reasoning_tokens: 0,
    },
  },
};

export const MOCK_LLAMA_INDEX_CHAT_OUTPUT = {
  message: {
    role: 'assistant',
    content: 'Test',
    additional_kwargs: {},
  },
  delta: null,
  logprobs: null,
  additional_kwargs: {
    prompt_tokens: 404,
    completion_tokens: 94,
    total_tokens: 498,
  },
};

export const MOCK_CHAT_SPAN: ModelTraceSpan = {
  ...commonSpanParts,
  attributes: {},
  context: { span_id: 'chat_span', trace_id: '1' },
  parent_span_id: null,
  name: 'chat_span',
  start_time: 3.1 * 1e6,
  end_time: 8.1 * 1e6,
  inputs: MOCK_LANGCHAIN_CHAT_INPUT,
  outputs: MOCK_LANGCHAIN_CHAT_OUTPUT,
  type: ModelSpanType.CHAT_MODEL,
};
