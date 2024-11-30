import { useState } from 'react';

import { Button, ChevronDownIcon, ChevronRightIcon, Typography, useDesignSystemTheme } from '@databricks/design-system';

export const ModelTraceExplorerCollapsibleSection = ({
  sectionKey,
  title,
  children,
  withBorder = false,
}: {
  sectionKey: string;
  title: React.ReactNode;
  children: React.ReactNode;
  withBorder?: boolean;
}) => {
  const [expanded, setExpanded] = useState(true);
  const { theme } = useDesignSystemTheme();
  return (
    <div css={{ marginBottom: theme.spacing.md }}>
      <div
        css={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'row',
          gap: theme.spacing.xs,
          marginBottom: theme.spacing.xs,
        }}
      >
        <Button
          size="small"
          componentId={`shared.model-trace-explorer.expand-${sectionKey}`}
          type="tertiary"
          icon={expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
          onClick={() => setExpanded(!expanded)}
        />
        <Typography.Title withoutMargins level={4} css={{ width: '100%' }}>
          {title}
        </Typography.Title>
      </div>
      {expanded && (
        <div
          css={{
            border: withBorder ? `1px solid ${theme.colors.border}` : '',
            borderRadius: withBorder ? theme.legacyBorders.borderRadiusMd : '',
            padding: withBorder ? theme.spacing.md : 0,
            paddingTop: withBorder ? theme.spacing.md : theme.spacing.sm,
            paddingBottom: 0,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};
