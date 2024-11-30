import { isNil, isString } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, ChevronDownIcon, ChevronUpIcon, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage } from '@databricks/i18n';

import type { CodeSnippetRenderMode, SearchMatch } from './ModelTrace.types';
import { ModelTraceExplorerHighlightedCodeSnippet } from './ModelTraceExplorerHighlightedCodeSnippet';
import { GenAIMarkdownRenderer } from '../genai-markdown-renderer';
import { CodeSnippet } from '../snippet';

const MAX_LINES_FOR_PREVIEW = 4;
// the `isContentLong` check does not work for
// markdown rendering, since the content is wrapped
const MAX_CHARS_FOR_PREVIEW = 300;

export function ModelTraceExplorerCodeSnippetBody({
  data,
  searchFilter,
  activeMatch,
  containsActiveMatch,
  renderMode,
}: {
  data: string;
  searchFilter: string;
  activeMatch: SearchMatch | null;
  containsActiveMatch: boolean;
  renderMode: CodeSnippetRenderMode;
}) {
  const containsMatches = Boolean(searchFilter) && !isNil(activeMatch) && data.toLowerCase().includes(searchFilter);
  const { theme } = useDesignSystemTheme();
  const [isContentLong, setIsContentLong] = useState(renderMode === 'json');
  const [expanded, setExpanded] = useState(containsMatches);
  const snippetRef = useRef<HTMLPreElement>(null);
  // if the data is rendered in text / markdown mode, then
  // we need to parse it so that the newlines are unescaped
  const dataToTruncate: string = useMemo(() => {
    if (renderMode === 'json') {
      return data;
    }

    const parsedData = JSON.parse(data);
    if (isString(parsedData)) {
      return parsedData;
    }

    return data;
  }, [data, renderMode]);

  const expandable =
    isContentLong ||
    dataToTruncate.split('\n').length > MAX_LINES_FOR_PREVIEW ||
    dataToTruncate.length > MAX_CHARS_FOR_PREVIEW;

  // Truncate after first 3 lines if not expanded
  const displayedData = useMemo(() => {
    if (expandable && !expanded) {
      const split = dataToTruncate.split('\n').slice(0, MAX_LINES_FOR_PREVIEW).join('\n');
      return split.length > MAX_CHARS_FOR_PREVIEW ? split.slice(0, MAX_CHARS_FOR_PREVIEW) : split;
    }

    return dataToTruncate;
  }, [dataToTruncate, expandable, expanded]);

  useEffect(() => {
    if (snippetRef.current) {
      setIsContentLong(snippetRef.current.scrollWidth > snippetRef.current.clientWidth);
    }
  }, [data]);

  // add a ref to the <pre> component within <CodeSnippet>.
  // we use the ref to check whether the <pre>'s content is overflowing
  const PreWithRef = useCallback((preProps: any) => <pre {...preProps} ref={snippetRef} />, []);

  if (containsMatches) {
    return (
      // if the snippet contains matches, render the search-highlighted version
      <ModelTraceExplorerHighlightedCodeSnippet
        data={data}
        searchFilter={searchFilter}
        activeMatch={activeMatch}
        containsActiveMatch={!activeMatch.isKeyMatch && containsActiveMatch}
      />
    );
  }

  return (
    <>
      {renderMode === 'markdown' ? (
        <div
          css={{
            padding: theme.spacing.md,
            backgroundColor: theme.colors.backgroundSecondary,
            marginBottom: -theme.spacing.md,
          }}
        >
          <GenAIMarkdownRenderer>{displayedData}</GenAIMarkdownRenderer>
        </div>
      ) : (
        <CodeSnippet
          PreTag={PreWithRef}
          showLineNumbers
          language={renderMode}
          lineProps={{ style: { wordBreak: 'break-word', whiteSpace: 'pre-wrap' } }}
          wrapLines={expanded}
          style={{
            backgroundColor: theme.colors.backgroundSecondary,
            padding: theme.spacing.sm,
            paddingBottom: expandable ? 0 : theme.spacing.sm,
            overflow: expanded ? 'auto' : 'hidden',
          }}
        >
          {displayedData}
        </CodeSnippet>
      )}
      {expandable && (
        <div css={{ backgroundColor: theme.colors.backgroundSecondary }}>
          <Button
            css={{ width: '100%', padding: theme.spacing.sm }}
            componentId={
              expanded ? 'shared.model-trace-explorer.snippet-see-less' : 'shared.model-trace-explorer.snippet-see-more'
            }
            icon={expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
            type="tertiary"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <FormattedMessage
                defaultMessage="See less"
                description="Model trace explorer > selected span > code snippet > see less button"
              />
            ) : (
              <FormattedMessage
                defaultMessage="See more"
                description="Model trace explorer > selected span > code snippet > see more button"
              />
            )}
          </Button>
        </div>
      )}
    </>
  );
}
