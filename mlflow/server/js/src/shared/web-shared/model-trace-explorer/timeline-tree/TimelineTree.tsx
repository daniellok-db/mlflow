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
import {
  Gantt,
  GanttRow,
  GanttCell,
  GanttHeader,
  GanttHeaderCell,
  GanttDividers,
  GanttBody,
  GanttVerticalMarkers,
} from '../../gantt';
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

  // Get the min and max start and end times of the tree
  const constraints = useMemo(() => getTimelineTreeSpanConstraints(rootNodes), [rootNodes]);

  // Get a flat list of all expanded nodes in the trace tree
  const expandedNodesList = useMemo(
    () => getTimelineTreeExpandedNodesList(rootNodes, expandedKeys),
    [rootNodes, expandedKeys],
  );

  // Get the number of rendered dividers based on the width of the Gantt chart
  const getDividersCount = (width: number, constraints: { max: number; min: number }) =>
    Math.max(2, Math.min(constraints.max / 1000, Math.floor(width / 100)));

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
          {showGantt && (
            <div css={{ flex: 1, boxSizing: 'border-box', marginTop: theme.spacing.sm }}>
              {/*
              First Gantt chart - this one is responsible for displaying headings and dividers.
              It should be rendered outside of the scrollable container to ensure that the headers are always visible.
            */}
              <Gantt
                start={constraints.min}
                end={constraints.max}
                numDividers={(width) => getDividersCount(width, constraints)}
                paddingLeft={25}
                paddingRight={75}
              >
                <GanttHeader
                  css={{
                    minHeight: ROW_HEIGHT,
                    maxHeight: ROW_HEIGHT,
                    boxSizing: 'border-box',
                    lineHeight: `${ROW_HEIGHT}px`,
                  }}
                >
                  <GanttDividers>
                    {(dividers) =>
                      dividers.map((divider) => (
                        <GanttHeaderCell key={divider} css={{ overflow: 'hidden' }}>
                          <LegacyTooltip title={headerTimeFormatter(divider)} placement="top">
                            <span>{headerTimeFormatter(divider)}</span>
                          </LegacyTooltip>
                        </GanttHeaderCell>
                      ))
                    }
                  </GanttDividers>
                </GanttHeader>
              </Gantt>
            </div>
          )}
        </div>
        <div css={{ height: '100%', overflowY: 'auto', display: 'flex' }}>
          {showGantt ? (
            <ModelTraceExplorerResizablePane
              paneWidth={paneWidth}
              setPaneWidth={setPaneWidth}
              initialRatio={0.67}
              leftChild={treeElement}
              leftMinWidth={SPAN_NAMES_MIN_WIDTH}
              rightChild={
                <div
                  css={{
                    flex: 1,
                    minWidth: GANTT_BARS_MIN_WIDTH,
                  }}
                  data-testid="time-marker-area"
                >
                  {/*
                Second Gantt chart - this one is responsible for displaying actual bars.
                It's aligned with the first one since it uses the same constraints
                */}
                  <Gantt
                    start={constraints.min}
                    end={constraints.max}
                    numDividers={(width) => getDividersCount(width, constraints)}
                    paddingLeft={25}
                    paddingRight={75}
                  >
                    <GanttBody>
                      {expandedNodesList.map((node, index) => {
                        const hasException = getSpanExceptionCount(node) > 0;
                        return (
                          <LegacyTooltip
                            key={node.key}
                            title={`${spanTimeFormatter(node.start)} - ${spanTimeFormatter(node.end)}`}
                            placement="right"
                            dangerouslySetAntdProps={{
                              visible: node.key === hoveredNode?.key,
                            }}
                          >
                            <GanttRow
                              top={index}
                              height={ROW_HEIGHT}
                              css={{
                                cursor: 'pointer',
                                backgroundColor:
                                  getGanttBackgroundColor(
                                    theme,
                                    node.key === hoveredNode?.key,
                                    node === selectedNode,
                                  ) || 'transparent',
                                '&:nth-of-type(2n+1)': {
                                  backgroundColor:
                                    getGanttBackgroundColor(
                                      theme,
                                      node.key === hoveredNode?.key,
                                      node === selectedNode,
                                    ) || 'transparent',
                                },
                              }}
                              onClick={() => setSelectedNode?.(node)}
                              onMouseEnter={() => setHoveredNode(node)}
                              onMouseLeave={() => setHoveredNode(undefined)}
                            >
                              <GanttCell
                                id={node.key}
                                start={node.start}
                                end={node.end}
                                css={{ backgroundColor: theme.colors.grey400 }}
                              >
                                <div
                                  css={{
                                    lineHeight: theme.typography.lineHeightSm,
                                    fontSize: theme.typography.fontSizeSm,
                                    position: 'absolute',
                                    left: '100%',
                                    marginLeft: theme.spacing.xs,
                                    top: 0,
                                    bottom: 0,
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                  }}
                                >
                                  {hasException && (
                                    <XCircleIcon css={{ marginRight: theme.spacing.xs, fontSize: 14 }} color="danger" />
                                  )}
                                  <Typography.Text color={hasException ? 'error' : 'primary'}>
                                    {spanTimeFormatter(node.end - node.start)}
                                  </Typography.Text>
                                </div>
                              </GanttCell>
                            </GanttRow>
                          </LegacyTooltip>
                        );
                      })}
                      <GanttVerticalMarkers />
                    </GanttBody>
                  </Gantt>
                </div>
              }
              rightMinWidth={GANTT_BARS_MIN_WIDTH}
            />
          ) : (
            treeElement
          )}
        </div>
      </div>
    </div>
  );
};
