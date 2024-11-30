import { values } from 'lodash';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Button, useDesignSystemTheme, VisibleIcon, VisibleOffIcon } from '@databricks/design-system';
import { FormattedMessage } from '@databricks/i18n';
import { useRecordEvent, useRecordProto } from '@databricks/web-shared/metrics';
import { recordObservabilityEvent } from '@databricks/web-shared/observability';

import type { ModelTrace, ModelTraceExplorerTab, ModelTraceSpanNode } from './ModelTrace.types';
import { parseModelTraceToTree } from './ModelTraceExplorer.utils';
import type { ModelTraceExplorerResizablePaneRef } from './ModelTraceExplorerResizablePane';
import ModelTraceExplorerResizablePane from './ModelTraceExplorerResizablePane';
import ModelTraceExplorerSearchBox from './ModelTraceExplorerSearchBox';
import { ModelTraceExplorerSkeleton } from './ModelTraceExplorerSkeleton';
import { useModelTraceSearch } from './hooks/useModelTraceSearch';
import { ModelTraceExplorerRightPaneTabs, RIGHT_PANE_MIN_WIDTH } from './right-pane/ModelTraceExplorerRightPaneTabs';
import { TimelineTree } from './timeline-tree';
import {
  GANTT_BARS_MIN_WIDTH,
  SPAN_NAMES_MIN_WIDTH,
  SPAN_NAMES_WITHOUT_GANTT_MIN_WIDTH,
} from './timeline-tree/TimelineTree.types';
import { getTimelineTreeNodesMap, useTimelineTreeExpandedNodes } from './timeline-tree/TimelineTree.utils';

/**
 * Format timestamp in microseconds to seconds
 */
const spanTimeFormatter = (us: number) => {
  const sec = us / 1e6;
  return `${Math.max(Math.round(sec * 100) / 100, 0.01).toFixed(2)}s`;
};

const getDefaultSplitParams: () => {
  ratio: number;
  showGantt: boolean;
} = () => {
  if (window.innerWidth <= 768) {
    return {
      ratio: 0.5,
      showGantt: false,
    };
  } else if (window.innerWidth <= 1280) {
    return {
      ratio: 0.33,
      showGantt: false,
    };
  } else if (window.innerWidth <= 1440) {
    return {
      ratio: 0.4,
      showGantt: true,
    };
  }

  return {
    ratio: 0.33,
    showGantt: true,
  };
};

export const ModelTraceExplorer = ({ modelTrace, className }: { modelTrace: ModelTrace; className?: string }) => {
  const { ratio: initialRatio, showGantt: defaultShowGantt } = getDefaultSplitParams();
  const paneRef = useRef<ModelTraceExplorerResizablePaneRef>(null);
  const treeNode = useMemo(() => parseModelTraceToTree(modelTrace), [modelTrace]);
  const [paneWidth, setPaneWidth] = useState(500);
  const [showGantt, setShowGantt] = useState(defaultShowGantt);
  const [activeTab, setActiveTab] = useState<ModelTraceExplorerTab>('content');

  const recordEvent = useRecordEvent();
  const recordProto = useRecordProto();
  const logSpanClick = useCallback(
    (
      span: ModelTraceSpanNode, // log the click with some span metadata
    ) =>
      recordObservabilityEvent(recordEvent, recordProto, {
        eventType: 'component_click',
        eventEntity: {
          entityType: 'component',
          entitySubType: 'div',
          entityId: `shared.model-trace-explorer.${span.type}-span-click`,
        },
        eventPayload: {
          interactionSubject: true,
        },
      }),
    [recordEvent, recordProto],
  );

  const [selectedNode, setSelectedNode] = useState<ModelTraceSpanNode | undefined>(treeNode ?? undefined);
  const {
    matchData,
    searchFilter,
    setSearchFilter,
    filteredTreeNodes,
    handleNextSearchMatch,
    handlePreviousSearchMatch,
  } = useModelTraceSearch({
    treeNode,
    selectedNode,
    setSelectedNode,
    setActiveTab,
  });

  const { expandedKeys, setExpandedKeys } = useTimelineTreeExpandedNodes({
    rootNodes: filteredTreeNodes,
    initialExpandAll: true,
  });
  const { theme } = useDesignSystemTheme();

  useLayoutEffect(() => {
    // expand all nodes when the tree changes
    const list = values(getTimelineTreeNodesMap(filteredTreeNodes));
    setExpandedKeys(list.map((node) => node.key));
  }, [filteredTreeNodes, setExpandedKeys]);

  const leftPaneMinWidth = showGantt ? SPAN_NAMES_MIN_WIDTH + GANTT_BARS_MIN_WIDTH : SPAN_NAMES_WITHOUT_GANTT_MIN_WIDTH;

  return (
    <div css={{ display: 'flex', flexDirection: 'column', height: '100%' }} className={className}>
      <div
        css={{
          padding: theme.spacing.xs,
          borderBottom: `1px solid ${theme.colors.border}`,
          borderTop: `1px solid ${theme.colors.border}`,
        }}
      >
        <ModelTraceExplorerSearchBox
          searchFilter={searchFilter}
          setSearchFilter={setSearchFilter}
          matchData={matchData}
          handleNextSearchMatch={handleNextSearchMatch}
          handlePreviousSearchMatch={handlePreviousSearchMatch}
        />
      </div>
      <ModelTraceExplorerResizablePane
        ref={paneRef}
        initialRatio={initialRatio}
        paneWidth={paneWidth}
        setPaneWidth={setPaneWidth}
        leftChild={
          <div
            css={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minWidth: leftPaneMinWidth,
            }}
          >
            {filteredTreeNodes.length > 0 ? (
              <TimelineTree
                rootNodes={filteredTreeNodes}
                selectedNode={selectedNode}
                setSelectedNode={setSelectedNode}
                spanTimeFormatter={spanTimeFormatter}
                treeHeader="Task name"
                css={{ flex: 1 }}
                expandedKeys={expandedKeys}
                setExpandedKeys={setExpandedKeys}
                showGantt={showGantt}
                onNodeClick={logSpanClick}
              />
            ) : (
              <div
                css={{
                  flex: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  paddingTop: theme.spacing.lg,
                }}
              >
                <FormattedMessage
                  defaultMessage="No results found. Try using a different search term."
                  description="Model trace explorer > no results found"
                />
              </div>
            )}
          </div>
        }
        leftMinWidth={leftPaneMinWidth}
        rightChild={
          <ModelTraceExplorerRightPaneTabs
            activeSpan={selectedNode}
            searchFilter={searchFilter}
            activeMatch={matchData.match}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        }
        rightMinWidth={RIGHT_PANE_MIN_WIDTH}
      />
      <div
        css={{
          backgroundColor: theme.colors.backgroundPrimary,
          position: 'absolute',
          bottom: 0,
          left: 0,
          margin: theme.spacing.md,
          // ensure the button renders above the resizable pane handle
          zIndex: 2,
        }}
      >
        <Button
          componentId={`shared.model-trace-explorer.${showGantt ? 'hide' : 'show'}-timeline`}
          icon={showGantt ? <VisibleOffIcon /> : <VisibleIcon />}
          onClick={() => {
            const newShowGantt = !showGantt;
            setShowGantt(newShowGantt);
            if (newShowGantt) {
              const newPaneWidth = Math.max(paneWidth, SPAN_NAMES_WITHOUT_GANTT_MIN_WIDTH + GANTT_BARS_MIN_WIDTH);
              setPaneWidth(newPaneWidth);
              paneRef.current?.updateRatio(newPaneWidth);
            }
          }}
        >
          {showGantt ? (
            <FormattedMessage
              defaultMessage="Hide timeline"
              description="Model trace explorer > hide timeline. This button hides the Gantt timeline view in the UI."
            />
          ) : (
            <FormattedMessage
              defaultMessage="Show timeline"
              description="Model trace explorer > show timeline. This button shows the Gantt timeline view in the UI."
            />
          )}
        </Button>
      </div>
    </div>
  );
};

ModelTraceExplorer.Skeleton = ModelTraceExplorerSkeleton;
