import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event-14';

import { DesignSystemProvider } from '@databricks/design-system';

import { ModelTraceExplorerContentTab } from './ModelTraceExplorerContentTab';
import type { ModelTraceSpan } from '../ModelTrace.types';
import { mockSpans, MOCK_RETRIEVER_SPAN, MOCK_CHAT_SPAN } from '../ModelTraceExplorer.test-utils';

const DEFAULT_SPAN: ModelTraceSpan = mockSpans[0];

describe('ModelTraceExplorerRightPane', () => {
  it('switches between span renderers appropriately', () => {
    const { rerender } = render(
      <DesignSystemProvider>
        <ModelTraceExplorerContentTab
          activeSpan={{
            ...DEFAULT_SPAN,
            start: DEFAULT_SPAN.start_time,
            end: DEFAULT_SPAN.end_time,
            key: DEFAULT_SPAN.context.span_id,
          }}
          searchFilter=""
          activeMatch={null}
        />
      </DesignSystemProvider>,
    );

    expect(screen.queryByTestId('model-trace-explorer-default-span-view')).toBeInTheDocument();

    rerender(
      <DesignSystemProvider>
        <ModelTraceExplorerContentTab
          activeSpan={{
            ...MOCK_RETRIEVER_SPAN,
            start: MOCK_RETRIEVER_SPAN.start_time,
            end: MOCK_RETRIEVER_SPAN.end_time,
            key: MOCK_RETRIEVER_SPAN.context.span_id,
          }}
          searchFilter=""
          activeMatch={null}
        />
        ,
      </DesignSystemProvider>,
    );

    expect(screen.queryByTestId('model-trace-explorer-retriever-span-view')).toBeInTheDocument();
  });

  it('should render conversations if possible', () => {
    render(
      <DesignSystemProvider>
        <ModelTraceExplorerContentTab
          activeSpan={{
            ...MOCK_CHAT_SPAN,
            start: DEFAULT_SPAN.start_time,
            end: DEFAULT_SPAN.end_time,
            key: DEFAULT_SPAN.context.span_id,
          }}
          searchFilter=""
          activeMatch={null}
        />
      </DesignSystemProvider>,
    );

    // check that the user text renders
    expect(screen.queryByText('User')).toBeInTheDocument();
    expect(screen.queryByText("What's the weather in Singapore and New York?")).toBeInTheDocument();

    // check that the tool calls render
    expect(screen.queryAllByText('Assistant')).toHaveLength(3); // 2 in input, 1 in output
    expect(screen.queryAllByText('get_weather')).toHaveLength(2);
  });

  it('allows users to choose the render mode for conversations', async () => {
    render(
      <DesignSystemProvider>
        <ModelTraceExplorerContentTab
          activeSpan={{
            ...MOCK_CHAT_SPAN,
            start: DEFAULT_SPAN.start_time,
            end: DEFAULT_SPAN.end_time,
            key: DEFAULT_SPAN.context.span_id,
          }}
          searchFilter=""
          activeMatch={null}
        />
      </DesignSystemProvider>,
    );

    // check that the toggle is rendered
    expect(screen.queryAllByTestId('model-trace-explorer-render-mode-toggle')).toHaveLength(2);

    const renderRawInputButton = screen.queryAllByTestId('model-trace-explorer-render-raw-input-button')[0];
    await userEvent.click(renderRawInputButton);

    expect(screen.queryAllByText('Assistant')).toHaveLength(1);
    expect(screen.queryByText('See more')).toBeInTheDocument();

    const renderRawOutputButton = screen.queryAllByTestId('model-trace-explorer-render-raw-input-button')[1];
    await userEvent.click(renderRawOutputButton);

    expect(screen.queryAllByText('Assistant')).toHaveLength(0);
    // 2 more expandable code snippets added by outputs
    expect(screen.queryAllByText('See more')).toHaveLength(3);
  });
});
