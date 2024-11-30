import { values } from 'lodash';
import { useState } from 'react';

import type { TimelineTreeNode } from './TimelineTree.types';
import type { ModelTraceSpanNode } from '../ModelTrace.types';

// Gets the min and max start and end times of the tree
export const getTimelineTreeSpanConstraints = (
  nodes: TimelineTreeNode[],
  constraints = { min: Number.MAX_SAFE_INTEGER, max: 0 },
) => {
  nodes.forEach((node) => {
    const { start, end, children } = node;
    if (start < constraints.min) {
      constraints.min = start;
    }
    if (end > constraints.max) {
      constraints.max = end;
    }
    getTimelineTreeSpanConstraints(children ?? [], constraints);
  });

  return constraints;
};

// Gets a flat list of all expanded nodes in the tree
export const getTimelineTreeExpandedNodesList = <T extends TimelineTreeNode & { children?: T[] }>(
  nodes: T[],
  expandedKeys: (string | number)[],
) => {
  const expandedNodesFlat: T[] = [];
  const traverseExpanded = (traversedNode: T | undefined) => {
    if (!traversedNode) {
      return;
    }
    expandedNodesFlat.push(traversedNode);
    if (expandedKeys.includes(traversedNode.key)) {
      traversedNode.children?.forEach(traverseExpanded);
    }
  };

  nodes.forEach(traverseExpanded);
  return expandedNodesFlat;
};

export const getTimelineTreeNodesMap = <T extends TimelineTreeNode & { children?: T[] }>(nodes: T[]) => {
  const nodesMap: { [nodeId: string]: T } = {};

  const traverse = (traversedNode: T | undefined) => {
    if (!traversedNode) {
      return;
    }
    nodesMap[traversedNode.key] = traversedNode;
    traversedNode.children?.forEach(traverse);
  };

  nodes.forEach(traverse);
  return nodesMap;
};

export const useTimelineTreeExpandedNodes = <T extends ModelTraceSpanNode & { children?: T[] }>(
  params: {
    rootNodes?: T[];
    initialExpandAll?: boolean;
  } = {},
) => {
  const [expandedKeys, setExpandedKeys] = useState<(string | number)[]>(() => {
    if (params.initialExpandAll && params.rootNodes) {
      const list = values(getTimelineTreeNodesMap(params.rootNodes));
      return list.map((node) => node.key);
    }
    return [];
  });

  return {
    expandedKeys,
    setExpandedKeys,
  };
};

export const useTimelineTreeSelectedNode = () => {
  const [selectedNode, setSelectedNode] = useState<ModelTraceSpanNode | undefined>(undefined);

  return {
    selectedNode,
    setSelectedNode,
  };
};
