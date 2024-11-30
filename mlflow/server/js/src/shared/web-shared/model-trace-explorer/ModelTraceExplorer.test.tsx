import { render, screen, within, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event-14';
import { cloneDeep } from 'lodash';

import { ModelTraceExplorer } from './ModelTraceExplorer';
import { MOCK_EVENTS_SPAN, MOCK_TRACE } from './ModelTraceExplorer.test-utils';

// mock the scrollIntoView function to prevent errors
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Since working ResizeObserver is a hard requirement for Gantt chart, let's mock it
let originalResizeObserver: typeof ResizeObserver;
beforeAll(() => {
  originalResizeObserver = globalThis.ResizeObserver;
  const mockedRect = {
    x: 0,
    y: 0,
    width: 1000,
    height: 100,
    top: 0,
    right: 1000,
    bottom: 100,
    left: 0,
  } as DOMRectReadOnly;

  globalThis.ResizeObserver = class MockResizeObserver {
    observerCallback: ResizeObserverCallback;
    targets: Element[];
    constructor(callback: ResizeObserverCallback) {
      this.observerCallback = callback;
      this.targets = [];
    }

    observe = (element: Element) => {
      this.targets.push(element);

      this.observerCallback(
        this.targets.map((target) => ({
          target,
          borderBoxSize: [{ inlineSize: mockedRect.width, blockSize: mockedRect.height }],
          contentBoxSize: [{ inlineSize: mockedRect.width, blockSize: mockedRect.height }],
          contentRect: mockedRect,
          devicePixelContentBoxSize: [{ inlineSize: mockedRect.width, blockSize: mockedRect.height }],
        })),
        this,
      );
    };

    unobserve = (element: Element) => {
      this.targets = this.targets.filter((target) => target !== element);
    };

    disconnect = () => {
      this.targets.length = 0;
    };
  };
});

afterAll(() => {
  globalThis.ResizeObserver = originalResizeObserver;
});

describe('ModelTraceExplorer', () => {
  it('renders the component and allows to inspect selected spans', async () => {
    render(<ModelTraceExplorer modelTrace={MOCK_TRACE} />);

    // Assert existence of task column header
    expect(screen.getByRole('heading', { name: 'Task name' })).toBeInTheDocument();

    // Expect timeline view to be closed at first (due to JSDOM's 1024 default screen width)
    expect(screen.queryByTestId('time-marker-area')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Show timeline'));

    // Assert existence of all calculated time spans
    expect(within(screen.getByTestId('time-marker-area')).getByText('25.00s')).toBeInTheDocument();
    expect(within(screen.getByTestId('time-marker-area')).getByText('5.00s')).toBeInTheDocument();
    expect(within(screen.getByTestId('time-marker-area')).getByText('0.50s')).toBeInTheDocument();

    // Check if the default input is rendered
    expect(screen.getByText('document-qa-chain-input')).toBeInTheDocument();

    // Switch to another span
    await userEvent.click(screen.getByText('rephrase_chat_to_queue'));

    // Check if the new input is rendered
    expect(screen.getByText('rephrase_chat_to_queue-input')).toBeInTheDocument();
  });

  it('filters the tree based on the search string', async () => {
    render(<ModelTraceExplorer modelTrace={MOCK_TRACE} />);
    const searchBar = screen.getByPlaceholderText('Search');

    await userEvent.type(searchBar, 'rephrase');
    await waitForElementToBeRemoved(await screen.findByText('document-qa-chain'));

    // Assert that only the filtered span is rendered
    expect(await screen.findByText('rephrase_chat_to_queue')).toBeInTheDocument();

    await userEvent.clear(searchBar);

    // Assert that the tree is reset
    expect(await screen.findByText('document-qa-chain')).toBeInTheDocument();

    await userEvent.type(searchBar, 'string with no match');

    // Assert that no spans are rendered
    expect(await screen.findByText('No results found. Try using a different search term.')).toBeInTheDocument();
  });

  it('rerenders only when a new root span ID is provided', async () => {
    const { rerender } = render(<ModelTraceExplorer modelTrace={MOCK_TRACE} />);

    // Assert that all spans are expanded
    expect(screen.getByText('document-qa-chain')).toBeInTheDocument();
    expect(screen.getByText('_generate_response')).toBeInTheDocument();
    expect(screen.getByText('rephrase_chat_to_queue')).toBeInTheDocument();

    // Select the third span
    await userEvent.click(screen.getByText('rephrase_chat_to_queue'));
    expect(await screen.findByText('rephrase_chat_to_queue-input')).toBeInTheDocument();

    // assert that the tree is not rerendered when the same root node is passed
    const clonedTrace = cloneDeep(MOCK_TRACE); // deep copy to make objects not referentially equal
    rerender(<ModelTraceExplorer modelTrace={clonedTrace} />);
    expect(await screen.findByText('rephrase_chat_to_queue-input')).toBeInTheDocument();

    // assert that the tree is rerendered when a new root span is passed
    const newTrace = cloneDeep(MOCK_TRACE);
    newTrace.data.spans[0].name = 'new-span';
    newTrace.data.spans[0].context.span_id = 'new-span';
    newTrace.data.spans[1].parent_span_id = 'new-span';
    rerender(<ModelTraceExplorer modelTrace={newTrace} />);

    // expect that the new span is rendered
    expect(await screen.findByText('new-span')).toBeInTheDocument();

    // expect that the span selection doesn't change if the previous node is still in the tree
    expect(await screen.findByText('rephrase_chat_to_queue-input')).toBeInTheDocument();
  });

  it('should allow jumping to matches', async () => {
    render(<ModelTraceExplorer modelTrace={MOCK_TRACE} />);

    // Search for the word "input"
    const searchBar = screen.getByPlaceholderText('Search');
    await userEvent.type(searchBar, 'input');

    // expect 3 matches (one in each span)
    expect(await screen.findByText('1 / 3')).toBeInTheDocument();

    // assert that the first span is selected by checking for the output
    // text (since the input text is broken up by a highlighted span)
    expect(await screen.findByText('document-qa-chain-output')).toBeInTheDocument();

    // next match
    const nextButton = await screen.findByTestId('next-search-match');
    await userEvent.click(nextButton);

    // assert that match label updates, and new span is selected
    expect(await screen.findByText('2 / 3')).toBeInTheDocument();
    expect(await screen.findByText('_generate_response-output')).toBeInTheDocument();

    await userEvent.click(nextButton);
    expect(await screen.findByText('3 / 3')).toBeInTheDocument();
    expect(await screen.findByText('rephrase_chat_to_queue-output')).toBeInTheDocument();

    // user shouldn't be able to progress past the last match
    await userEvent.click(nextButton);
    expect(await screen.findByText('3 / 3')).toBeInTheDocument();
    expect(await screen.findByText('rephrase_chat_to_queue-output')).toBeInTheDocument();

    const prevButton = await screen.findByTestId('prev-search-match');
    await userEvent.click(prevButton);
    expect(await screen.findByText('2 / 3')).toBeInTheDocument();
    expect(await screen.findByText('_generate_response-output')).toBeInTheDocument();

    await userEvent.click(prevButton);
    expect(await screen.findByText('1 / 3')).toBeInTheDocument();
    expect(await screen.findByText('document-qa-chain-output')).toBeInTheDocument();

    // user shouldn't be able to progress past the first match
    await userEvent.click(prevButton);
    expect(await screen.findByText('1 / 3')).toBeInTheDocument();
    expect(await screen.findByText('document-qa-chain-output')).toBeInTheDocument();
  });

  it('should open the correct tabs when searching', async () => {
    const trace = {
      data: {
        spans: [MOCK_EVENTS_SPAN],
      },
      info: {},
    };

    render(<ModelTraceExplorer modelTrace={trace} />);

    // expect that the content tab is open by default
    expect(await screen.findByText('events_span-input')).toBeInTheDocument();

    // search for an attribute
    const searchBar = screen.getByPlaceholderText('Search');
    await userEvent.type(searchBar, 'top-level-attribute');

    // expect that the attributes tab is open
    expect(await screen.findByText('top-level-attribute')).toBeInTheDocument();

    await userEvent.clear(searchBar);
    await userEvent.type(searchBar, 'event1-attr1');

    expect(await screen.findByText('event-level-attribute')).toBeInTheDocument();
  });
});
