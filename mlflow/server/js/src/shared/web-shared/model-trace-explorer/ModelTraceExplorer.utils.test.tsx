import { describe, expect, it } from '@jest/globals';

import { ModelSpanType, type ModelTraceSpanNode } from './ModelTrace.types';
import {
  MOCK_LANGCHAIN_CHAT_INPUT,
  MOCK_LANGCHAIN_CHAT_OUTPUT,
  MOCK_LLAMA_INDEX_CHAT_OUTPUT,
  MOCK_OPENAI_CHAT_INPUT,
  MOCK_OPENAI_CHAT_OUTPUT,
  MOCK_TRACE,
} from './ModelTraceExplorer.test-utils';
import {
  parseModelTraceToTree,
  searchTree,
  getMatchesFromSpan,
  normalizeConversation,
} from './ModelTraceExplorer.utils';

describe('parseTraceToTree', () => {
  it('should parse a trace into an MLflowSpanNode', () => {
    const rootNode = parseModelTraceToTree(MOCK_TRACE);

    expect(rootNode).toBeDefined();
    expect(rootNode).toEqual(
      expect.objectContaining({
        key: 'document-qa-chain',
        title: 'document-qa-chain',
        children: [
          expect.objectContaining({
            key: '_generate_response',
            title: '_generate_response',
            children: [
              expect.objectContaining({
                key: 'rephrase_chat_to_queue',
                title: 'rephrase_chat_to_queue',
              }),
            ],
          }),
        ],
      }),
    );
  });

  it('should return null if the trace has no spans', () => {
    const rootNode = parseModelTraceToTree({
      ...MOCK_TRACE,
      trace_data: {
        spans: [],
      },
    });

    expect(rootNode).toBeNull();
  });
});

describe('searchTree', () => {
  it('should filter a tree based on a search string', () => {
    const rootNode = parseModelTraceToTree(MOCK_TRACE) as ModelTraceSpanNode;
    const { filteredTreeNodes: rephraseNodes } = searchTree(rootNode, 'rephrase');

    expect(rephraseNodes).toEqual([
      expect.objectContaining({
        key: 'rephrase_chat_to_queue',
        title: 'rephrase_chat_to_queue',
      }),
    ]);

    const { filteredTreeNodes: predictNodes } = searchTree(rootNode, 'predict');
    expect(predictNodes).toEqual([
      expect.objectContaining({
        key: 'document-qa-chain',
        title: 'document-qa-chain',
        children: [
          expect.objectContaining({
            key: '_generate_response',
            title: '_generate_response',
            // the child of `_generate_response` should be
            // cut out as it does not contain `predict`.
            children: [],
          }),
        ],
      }),
    ]);
  });

  it('should return a list of matches from each node', () => {
    const rootNode = parseModelTraceToTree(MOCK_TRACE) as ModelTraceSpanNode;

    // should match the "response" key in the output of all spans
    // and also the "_generate_response-*" values in the second span
    const { matches: resMatches } = searchTree(rootNode, 'res');

    expect(resMatches).toEqual([
      // first span
      expect.objectContaining({
        section: 'outputs',
        key: 'response',
        isKeyMatch: true,
        matchIndex: 0,
      }),
      // second span
      expect.objectContaining({
        section: 'inputs',
        key: 'query',
        isKeyMatch: false,
        matchIndex: 0,
      }),
      expect.objectContaining({
        section: 'outputs',
        key: 'response',
        isKeyMatch: true,
        matchIndex: 0,
      }),
      expect.objectContaining({
        section: 'outputs',
        key: 'response',
        isKeyMatch: false,
        matchIndex: 0,
      }),
      // last span
      expect.objectContaining({
        section: 'outputs',
        key: 'response',
        isKeyMatch: true,
        matchIndex: 0,
      }),
    ]);

    // should work on attributes as well
    const { matches: predictMatches } = searchTree(rootNode, 'predict');
    expect(predictMatches).toEqual([
      // first span
      expect.objectContaining({
        section: 'attributes',
        key: 'function_name',
        isKeyMatch: false,
        matchIndex: 0,
      }),
      // second span
      expect.objectContaining({
        section: 'attributes',
        key: 'function_name',
        isKeyMatch: false,
        matchIndex: 0,
      }),
    ]);
  });
});

describe('getMatchesFromSpan', () => {
  it('should not crash if a span has any undefined fields', () => {
    const spanNode: ModelTraceSpanNode = {
      key: 'test',
      title: 'test',
      children: [],
      inputs: undefined,
      outputs: undefined,
      attributes: undefined,
      start: 0,
      end: 1,
      type: ModelSpanType.UNKNOWN,
    };

    expect(getMatchesFromSpan(spanNode, 'no-match')).toHaveLength(0);
  });
});

describe('normalizeConversation', () => {
  it('handles a langchain chat input', () => {
    expect(normalizeConversation(MOCK_LANGCHAIN_CHAT_INPUT)).toEqual([
      expect.objectContaining({
        role: 'user',
        content: "What's the weather in Singapore and New York?",
      }),
      expect.objectContaining({
        role: 'assistant',
        content: '',
        tool_calls: [
          {
            id: '1',
            function: {
              // assert that it pretty prints
              arguments: '{\n  "city": "Singapore"\n}',
              name: 'get_weather',
            },
          },
        ],
      }),
      expect.objectContaining({
        role: 'assistant',
        content: '',
        tool_calls: [
          {
            id: '2',
            function: {
              arguments: '{\n  "city": "New York"\n}',
              name: 'get_weather',
            },
          },
        ],
      }),
      expect.objectContaining({
        role: 'tool',
        content: "It's hot in Singapore",
        tool_call_id: '1',
      }),
    ]);
  });

  it('handles a langchain chat output', () => {
    expect(normalizeConversation(MOCK_LANGCHAIN_CHAT_OUTPUT)).toEqual([
      expect.objectContaining({
        role: 'assistant',
        content: 'The weather in Singapore is hot, while in New York, it is cold.',
      }),
    ]);
  });

  it('handles an OpenAI chat input', () => {
    expect(normalizeConversation(MOCK_OPENAI_CHAT_INPUT)).toEqual([
      expect.objectContaining({
        role: 'user',
        content: 'tell me a joke in 50 words',
      }),
      expect.objectContaining({
        role: 'assistant',
        content: '',
        tool_calls: [
          {
            id: '1',
            function: {
              arguments: '{\n  "joke_length": 50\n}',
              name: 'tell_joke',
            },
          },
        ],
      }),
      expect.objectContaining({
        role: 'tool',
        content: 'Why did the scarecrow win an award? Because he was outstanding in his field!',
      }),
    ]);
  });

  it('handles an OpenAI chat output', () => {
    expect(normalizeConversation(MOCK_OPENAI_CHAT_OUTPUT)).toEqual([
      expect.objectContaining({
        role: 'assistant',
        content: 'Why did the scarecrow win an award? Because he was outstanding in his field!',
      }),
    ]);
  });

  it('handles a LlamaIndex chat output', () => {
    expect(normalizeConversation(MOCK_LLAMA_INDEX_CHAT_OUTPUT)).toEqual([
      expect.objectContaining({
        role: 'assistant',
        content: 'Test',
      }),
    ]);
  });

  it('handles a properly formatted input', () => {
    const input = [{ role: 'user', content: 'Hello' }];
    // should be unchanged
    expect(normalizeConversation(input)).toEqual(input);
  });

  it('handles an empty input', () => {
    expect(normalizeConversation(undefined)).toEqual(null);
  });

  it('returns null on unknown roles', () => {
    // openai format
    expect(normalizeConversation({ messages: [{ role: 'unknown', content: 'Hello' }] })).toBeNull();

    // langchain format
    expect(normalizeConversation({ messages: [{ type: 'unknown', content: 'Hello' }] })).toBeNull();
  });
});
