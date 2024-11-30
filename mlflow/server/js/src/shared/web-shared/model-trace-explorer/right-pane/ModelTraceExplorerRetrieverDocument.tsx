import { useCallback, useState } from 'react';

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

  return expanded ? (
    <ModelTraceExplorerRetrieverDocumentFull text={text} metadataTags={metadataTags} setExpanded={setExpanded} />
  ) : (
    <ModelTraceExplorerRetrieverDocumentPreview text={text} metadataTags={metadataTags} setExpanded={setExpanded} />
  );
}
