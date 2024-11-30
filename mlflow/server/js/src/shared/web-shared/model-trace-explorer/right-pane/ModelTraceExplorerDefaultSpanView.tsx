import { isNil } from 'lodash';
import { useEffect, useMemo, useState } from 'react';

import { FormattedMessage } from 'react-intl';

import { ModelTraceExplorerConversation } from './ModelTraceExplorerConversation';
import type { ModelTraceSpanNode, SearchMatch } from '../ModelTrace.types';
import { createListFromObject, normalizeConversation } from '../ModelTraceExplorer.utils';
import { ModelTraceExplorerCodeSnippet } from '../ModelTraceExplorerCodeSnippet';
import { ModelTraceExplorerCollapsibleSection } from '../ModelTraceExplorerCollapsibleSection';
import { ModelTraceExplorerRenderModeToggle } from '../ModelTraceExplorerRenderModeToggle';

export function ModelTraceExplorerDefaultSpanView({
  activeSpan,
  className,
  searchFilter,
  activeMatch,
}: {
  activeSpan: ModelTraceSpanNode | undefined;
  className?: string;
  searchFilter: string;
  activeMatch: SearchMatch | null;
}) {
  const inputList = useMemo(() => createListFromObject(activeSpan?.inputs), [activeSpan]);
  const outputList = useMemo(() => createListFromObject(activeSpan?.outputs), [activeSpan]);

  // attempt to detect and render LLM conversations
  const conversationInput = useMemo(() => normalizeConversation(activeSpan?.inputs), [activeSpan]);
  const conversationOutput = useMemo(() => normalizeConversation(activeSpan?.outputs), [activeSpan]);

  const [renderConversationInput, setRenderConversationInput] = useState(conversationInput !== null);
  const [renderConversationOutput, setRenderConversationOutput] = useState(conversationOutput !== null);

  useEffect(() => {
    setRenderConversationInput(conversationInput !== null);
    setRenderConversationOutput(conversationOutput !== null);
  }, [conversationInput, conversationOutput]);

  if (isNil(activeSpan)) {
    return null;
  }

  const containsInputs = inputList.length > 0;
  const containsOutputs = outputList.length > 0;

  const isActiveMatchSpan = !isNil(activeMatch) && activeMatch.span.key === activeSpan.key;

  return (
    <div data-testid="model-trace-explorer-default-span-view">
      {containsInputs && (
        <ModelTraceExplorerCollapsibleSection
          withBorder={!renderConversationInput}
          sectionKey="input"
          title={
            <div
              css={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <FormattedMessage
                defaultMessage="Inputs"
                description="Model trace explorer > selected span > inputs header"
              />
              {conversationInput && (
                <ModelTraceExplorerRenderModeToggle
                  shouldRenderMarkdown={renderConversationInput}
                  setShouldRenderMarkdown={setRenderConversationInput}
                />
              )}
            </div>
          }
        >
          {conversationInput && renderConversationInput ? (
            <ModelTraceExplorerConversation messages={conversationInput} />
          ) : (
            inputList.map(({ key, value }, index) => (
              <ModelTraceExplorerCodeSnippet
                key={key || index}
                title={key}
                data={value}
                searchFilter={searchFilter}
                activeMatch={activeMatch}
                containsActiveMatch={isActiveMatchSpan && activeMatch.section === 'inputs' && activeMatch.key === key}
              />
            ))
          )}
        </ModelTraceExplorerCollapsibleSection>
      )}
      {containsOutputs && (
        <ModelTraceExplorerCollapsibleSection
          withBorder={!renderConversationOutput}
          sectionKey="output"
          title={
            <div css={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <FormattedMessage
                defaultMessage="Outputs"
                description="Model trace explorer > selected span > outputs header"
              />
              {conversationOutput && (
                <ModelTraceExplorerRenderModeToggle
                  shouldRenderMarkdown={renderConversationOutput}
                  setShouldRenderMarkdown={setRenderConversationOutput}
                />
              )}
            </div>
          }
        >
          {conversationOutput && renderConversationOutput ? (
            <ModelTraceExplorerConversation messages={conversationOutput} />
          ) : (
            outputList.map(({ key, value }) => (
              <ModelTraceExplorerCodeSnippet
                key={key}
                title={key}
                data={value}
                searchFilter={searchFilter}
                activeMatch={activeMatch}
                containsActiveMatch={isActiveMatchSpan && activeMatch.section === 'outputs' && activeMatch.key === key}
              />
            ))
          )}
        </ModelTraceExplorerCollapsibleSection>
      )}
    </div>
  );
}
