import React, { useMemo, useState } from 'react';

import {
  type ThemeType,
  Tree,
  Typography,
  useDesignSystemTheme,
  LegacyTooltip,
  XCircleIcon,
} from '@databricks/design-system';

import { GANTT_BARS_MIN_WIDTH, SPAN_NAMES_MIN_WIDTH, type TimelineTreeNode } from './TimelineTree.types';
import {
  getTimelineTreeExpandedNodesList,
  getTimelineTreeNodesMap,
  getTimelineTreeSpanConstraints,
} from './TimelineTree.utils';
import { TimelineTreeTitle } from './TimelineTreeTitle';
import type { ModelTraceSpanNode } from '../ModelTrace.types';
import { getSpanExceptionCount } from '../ModelTraceExplorer.utils';
import ModelTraceExplorerResizablePane from '../ModelTraceExplorerResizablePane';

const ROW_HEIGHT = 24;

const getGanttBackgroundColor = (theme: ThemeType, isHovered = false, isSelected = false) => {
  if (isSelected) {
    return theme.colors.actionTertiaryBackgroundPress;
  }
  if (isHovered) {
    return theme.colors.actionTertiaryBackgroundHover;
  }
  return undefined;
};

const headerTimeFormatter = (us: number) => `${(us / 1e6).toFixed(2)} s`;

const decorateSpan = (
  node: ModelTraceSpanNode,
  spanTimeFormatter: (us: number) => string,
  withTimePill: boolean,
): ModelTraceSpanNode => {
  const children = node.children?.map((child) => decorateSpan(child, spanTimeFormatter, withTimePill));

  return {
    ...node,
    children,
    title: (
      <TimelineTreeTitle key={node.key} node={node} spanTimeFormatter={spanTimeFormatter} withTimePill={withTimePill} />
    ),
  };
};

export const TimelineTree = <NodeType extends ModelTraceSpanNode & { children?: NodeType[] }>({
  rootNodes,
  selectedNode,
  setSelectedNode,
  expandedKeys = [],
  setExpandedKeys,
  spanTimeFormatter = (us: number) => `${(us / 1e6).toFixed(2)} s`,
  treeHeader,
  className,
  showGantt = true,
  onNodeClick,
}: {
  selectedNode?: NodeType;
  setSelectedNode?: (node: NodeType) => void;
  rootNodes: NodeType[];
  expandedKeys?: (string | number)[];
  setExpandedKeys?: (keys: (string | number)[]) => void;
  spanTimeFormatter?: (time: number) => string;
  treeHeader?: React.ReactNode;
  className?: string;
  showGantt?: boolean;
  onNodeClick?: (node: NodeType) => void;
}) => {
  const { theme, getPrefixedClassName } = useDesignSystemTheme();

  const treeTitleClassName = getPrefixedClassName('tree-title');
  const treeClassName = getPrefixedClassName('tree');
  const treeNodeWrapperClassName = getPrefixedClassName('tree-node-content-wrapper');

  // Get a map of all nodes in the tree
  const nodesMap = useMemo(() => getTimelineTreeNodesMap(rootNodes), [rootNodes]);

  const [paneWidth, setPaneWidth] = useState(200);

  const [hoveredNode, setHoveredNode] = useState<TimelineTreeNode | undefined>(undefined);

  // Get the tree data structure that can be used by the <Tree> component
  const treeData = useMemo(
    () => rootNodes.map((node) => decorateSpan(node, spanTimeFormatter, !showGantt)),
    [rootNodes, showGantt, spanTimeFormatter],
  );

  const treeElement = useMemo(
    () => (
      <div
        css={{
          flex: 1,
          overflow: 'auto',
          minHeight: '100%',
          height: 'min-content',
          // space for the floating "show/hide timeline" button
          paddingBottom: theme.spacing.lg * 3,
          borderRight: showGantt ? `1px solid ${theme.colors.border}` : undefined,
          boxSizing: 'border-box',

          display: 'flex',
          [`.${treeTitleClassName}`]: {
            whiteSpace: 'nowrap',
          },
          [`.${treeClassName}`]: {
            flex: '1 0 auto',
          },
          [`.${treeNodeWrapperClassName} > span:first-child`]: {
            flexShrink: 0,
          },
          minWidth: SPAN_NAMES_MIN_WIDTH,
        }}
      >
        <Tree
          showLine={{ showLeafIcon: false }}
          selectedKeys={selectedNode ? [selectedNode.key] : []}
          dangerouslySetAntdProps={{
            showIcon: true,
            onMouseEnter: (
              // Antd types are not correct here, hence the `any`
              { node }: any,
            ) => setHoveredNode(node),
            onMouseLeave: () => setHoveredNode(undefined),
          }}
          mode="selectable"
          treeData={treeData}
          expandedKeys={expandedKeys}
          onExpand={setExpandedKeys}
          onSelect={(newSelectedKeys) => {
            // Disallow deselecting all nodes
            if (newSelectedKeys.length === 0) {
              return;
            }
            const selectedNode = nodesMap[newSelectedKeys[0]];
            setSelectedNode?.(selectedNode);
            onNodeClick?.(selectedNode);
          }}
        />
      </div>
    ),
    [
      showGantt,
      theme,
      treeTitleClassName,
      treeClassName,
      treeNodeWrapperClassName,
      selectedNode,
      treeData,
      expandedKeys,
      setExpandedKeys,
      nodesMap,
      setSelectedNode,
      onNodeClick,
    ],
  );

  return (
    <div
      css={{
        height: '100%',
        borderRadius: theme.legacyBorders.borderRadiusMd,
        overflow: 'hidden',
        display: 'flex',
      }}
      className={className}
    >
      <div
        css={{
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        <div css={{ display: 'flex' }}>
          <div
            css={{
              borderBottom: `1px solid ${theme.colors.border}`,
              boxSizing: 'border-box',
              marginTop: theme.spacing.sm,
              paddingLeft: theme.spacing.sm,
              height: ROW_HEIGHT,
            }}
            style={{ flex: showGantt ? `0 0 ${paneWidth}px` : 1 }}
          >
            <Typography.Title withoutMargins level={4}>
              {treeHeader}
            </Typography.Title>
          </div>
        </div>
        <div css={{ height: '100%', overflowY: 'auto', display: 'flex' }}>{treeElement}</div>
      </div>
    </div>
  );
};
