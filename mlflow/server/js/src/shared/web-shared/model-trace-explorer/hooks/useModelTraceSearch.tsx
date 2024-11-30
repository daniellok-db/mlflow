import { isNil } from 'lodash';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';

import type { ModelTraceExplorerTab, ModelTraceSpanNode, SearchMatch } from '../ModelTrace.types';
import { searchTree } from '../ModelTraceExplorer.utils';
import { getTimelineTreeNodesMap } from '../timeline-tree/TimelineTree.utils';

const getTabForMatch = (match: SearchMatch): ModelTraceExplorerTab => {
  switch (match.section) {
    case 'inputs':
    case 'outputs':
      return 'content';
    case 'attributes':
      return 'attributes';
    case 'events':
      return 'events';
    default:
      // shouldn't happen
      return 'content';
  }
};

export const useModelTraceSearch = ({
  treeNode,
  selectedNode,
  setSelectedNode,
  setActiveTab,
}: {
  treeNode: ModelTraceSpanNode | null;
  selectedNode: ModelTraceSpanNode | undefined;
  setSelectedNode: (node: ModelTraceSpanNode) => void;
  setActiveTab: (tab: ModelTraceExplorerTab) => void;
}): {
  searchFilter: string;
  setSearchFilter: (filter: string) => void;
  filteredTreeNodes: ModelTraceSpanNode[];
  matchData: {
    match: SearchMatch | null;
    totalMatches: number;
    currentMatchIndex: number;
  };
  handleNextSearchMatch: () => void;
  handlePreviousSearchMatch: () => void;
} => {
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const { filteredTreeNodes, matches } = useMemo(() => {
    if (isNil(treeNode)) {
      return {
        filteredTreeNodes: [],
        matches: [],
      };
    }

    return searchTree(treeNode, searchFilter);
    // use the span ID to determine whether the state should be recomputed.
    // using the whole object seems to cause the state to be reset at
    // unexpected times.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeNode?.key, searchFilter]);

  const handleNextSearchMatch = useCallback(() => {
    if (activeMatchIndex < matches.length - 1) {
      setActiveMatchIndex(activeMatchIndex + 1);
      const match = matches[activeMatchIndex + 1];
      setSelectedNode(match.span);
      setActiveTab(getTabForMatch(match));
    }
  }, [activeMatchIndex, matches, setSelectedNode, setActiveTab]);

  const handlePreviousSearchMatch = useCallback(() => {
    if (activeMatchIndex > 0) {
      setActiveMatchIndex(activeMatchIndex - 1);
      const match = matches[activeMatchIndex - 1];
      setSelectedNode(match.span);
      setActiveTab(getTabForMatch(match));
    }
  }, [activeMatchIndex, matches, setSelectedNode, setActiveTab]);

  useLayoutEffect(() => {
    if (filteredTreeNodes.length === 0) {
      return;
    }

    // this case can trigger on two conditions:
    // 1. the search term is cleared, therefore there are no matches
    // 2. the search term only matches on span names, which don't count
    //    as matches since we don't support jumping to them.
    if (matches.length === 0) {
      const nodeMap = getTimelineTreeNodesMap(filteredTreeNodes);

      // if the selected node is no longer in the tree, then select
      // the first node. this can occur from condition #2 above
      if (!((selectedNode?.key ?? '') in nodeMap)) {
        setSelectedNode(filteredTreeNodes[0]);
      }

      // otherwise, if search was cleared, then we don't want to
      // do anything. this is to preserve the user's context
      // (e.g. they've jumped to a span and now want to dive deeper)
      return;
    }

    // when matches update, select the first match
    setActiveMatchIndex(0);
    setSelectedNode(matches[0].span);
    setActiveTab(getTabForMatch(matches[0]));
    // don't subscribe to selectedNode to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTreeNodes, matches, setSelectedNode]);

  return {
    matchData: {
      match: matches[activeMatchIndex] ?? null,
      totalMatches: matches.length,
      currentMatchIndex: activeMatchIndex,
    },
    searchFilter: searchFilter.toLowerCase().trim(),
    setSearchFilter,
    filteredTreeNodes,
    handleNextSearchMatch,
    handlePreviousSearchMatch,
  };
};
