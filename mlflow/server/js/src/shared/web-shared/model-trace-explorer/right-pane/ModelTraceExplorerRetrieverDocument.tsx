import { useCallback, useState } from 'react';

import { useRecordEvent, useRecordProto } from '@databricks/web-shared/metrics';
import { recordObservabilityEvent } from '@databricks/web-shared/observability';

import { ModelTraceExplorerRetrieverDocumentFull } from './ModelTraceExplorerRetrieverDocumentFull';
import { ModelTraceExplorerRetrieverDocumentPreview } from './ModelTraceExplorerRetrieverDocumentPreview';
import { createListFromObject } from '../ModelTraceExplorer.utils';

export function ModelTraceExplorerRetrieverDocument({
  text,
  metadata,
}: {
  text: string;
  metadata: { [key: string]: any };
}) {
  const [expanded, setExpanded] = useState(false);
  const metadataTags = createListFromObject(metadata);

  const recordEvent = useRecordEvent();
  const recordProto = useRecordProto();
  const logDocumentClick = useCallback(
    (action: string) => {
      recordObservabilityEvent(recordEvent, recordProto, {
        eventType: 'component_click',
        eventEntity: {
          entityType: 'component',
          entitySubType: 'div',
          entityId: `shared.model-trace-explorer.retriever-document-${action}`,
        },
        eventPayload: {
          interactionSubject: true,
        },
      });
    },
    [recordEvent, recordProto],
  );

  return expanded ? (
    <ModelTraceExplorerRetrieverDocumentFull
      text={text}
      metadataTags={metadataTags}
      setExpanded={setExpanded}
      logDocumentClick={logDocumentClick}
    />
  ) : (
    <ModelTraceExplorerRetrieverDocumentPreview
      text={text}
      metadataTags={metadataTags}
      setExpanded={setExpanded}
      logDocumentClick={logDocumentClick}
    />
  );
}
