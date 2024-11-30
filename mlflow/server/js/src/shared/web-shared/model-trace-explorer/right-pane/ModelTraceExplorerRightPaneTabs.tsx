import type { Interpolation, Theme } from '@emotion/react';
import { isNil } from 'lodash';
import React from 'react';

import { Empty, Tabs, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage } from '@databricks/i18n';

import { ModelTraceExplorerAttributesTab } from './ModelTraceExplorerAttributesTab';
import { ModelTraceExplorerContentTab } from './ModelTraceExplorerContentTab';
import { ModelTraceExplorerEventsTab } from './ModelTraceExplorerEventsTab';
import type { ModelTraceExplorerTab, ModelTraceSpanNode, SearchMatch } from '../ModelTrace.types';
import { getSpanExceptionCount } from '../ModelTraceExplorer.utils';
import { ModelTraceExplorerBadge } from '../ModelTraceExplorerBadge';

export const RIGHT_PANE_MIN_WIDTH = 300;

export function ModelTraceExplorerRightPaneTabs({
  activeSpan,
  searchFilter,
  activeMatch,
  activeTab,
  setActiveTab,
}: {
  activeSpan: ModelTraceSpanNode | undefined;
  searchFilter: string;
  activeMatch: SearchMatch | null;
  activeTab: ModelTraceExplorerTab;
  setActiveTab: (tab: ModelTraceExplorerTab) => void;
}) {
  const { theme } = useDesignSystemTheme();
  const contentStyle: Interpolation<Theme> = { flex: 1, marginTop: -theme.spacing.md, overflowY: 'auto' };

  if (isNil(activeSpan)) {
    return <Empty description="Please select a span to view more information" />;
  }

  const exceptionCount = getSpanExceptionCount(activeSpan);
  const hasException = exceptionCount > 0;

  return (
    <Tabs.Root
      componentId="shared.model-trace-explorer.right-pane-tabs"
      css={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        borderLeft: `1px solid ${theme.colors.border}`,
        minWidth: RIGHT_PANE_MIN_WIDTH,
      }}
      value={activeTab}
      onValueChange={(tab: string) => setActiveTab(tab as ModelTraceExplorerTab)}
      defaultValue="content"
    >
      <Tabs.List
        css={{
          padding: `0px ${theme.spacing.md}px`,
          boxSizing: 'border-box',
        }}
      >
        <Tabs.Trigger value="content">
          <FormattedMessage
            defaultMessage="Inputs / Outputs"
            description="Label for the inputs and outputs tab of the model trace explorer."
          />
        </Tabs.Trigger>
        {/* no i18n for attributes and events as these are properties specified by code,
            and it might be confusing for users to have different labels here */}
        <Tabs.Trigger value="attributes">Attributes</Tabs.Trigger>
        <Tabs.Trigger value="events">
          Events {hasException && <ModelTraceExplorerBadge count={exceptionCount} />}
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content css={contentStyle} value="content">
        <ModelTraceExplorerContentTab activeSpan={activeSpan} searchFilter={searchFilter} activeMatch={activeMatch} />
      </Tabs.Content>
      <Tabs.Content css={contentStyle} value="attributes">
        <ModelTraceExplorerAttributesTab
          activeSpan={activeSpan}
          searchFilter={searchFilter}
          activeMatch={activeMatch}
        />
      </Tabs.Content>
      <Tabs.Content css={contentStyle} value="events">
        <ModelTraceExplorerEventsTab activeSpan={activeSpan} searchFilter={searchFilter} activeMatch={activeMatch} />
      </Tabs.Content>
    </Tabs.Root>
  );
}
