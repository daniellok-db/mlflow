import { useMemo } from 'react';

import type { ThemeType } from '@databricks/design-system';
import { FunctionIcon, Tooltip, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { CodeSnippet } from '@databricks/web-shared/snippet';

import type { ModelTraceToolCall } from '../ModelTrace.types';

// temporary copy-paste from `webapp/web/js/genai/ai-playground/src/components/colors.ts`
// until we move these styles to web-shared
const getToolColors = (theme: ThemeType) => {
  const iconColor = theme.isDarkMode ? theme.colors.tagPurple : theme.colors.tagIndigo;
  const textColor = theme.isDarkMode ? theme.colors.white : theme.colors.tagIndigo;
  const backgroundBaseColor = theme.colors.tagPurple;
  const backgroundOpacity = theme.isDarkMode ? '48%' : '12%';
  const backgroundColor = `color-mix(in srgb, ${backgroundBaseColor} ${backgroundOpacity}, transparent)`;
  return { iconColor, textColor, backgroundColor };
};

export function ModelTraceExplorerToolCallMessage({ toolCall }: { toolCall: ModelTraceToolCall }) {
  const { theme } = useDesignSystemTheme();
  const { iconColor, textColor, backgroundColor } = useMemo(() => getToolColors(theme), [theme]);

  return (
    <div key={toolCall.id}>
      <div
        css={{
          display: 'flex',
          flexDirection: 'row',
          gap: theme.spacing.xs,
          alignItems: 'center',
          marginBottom: theme.spacing.sm,
        }}
      >
        <div
          css={{
            display: 'inline-flex',
            flexDirection: 'row',
            gap: theme.spacing.sm,
            backgroundColor: backgroundColor,
            alignItems: 'center',
            padding: `2px ${theme.spacing.xs}px`,
            width: 'min-content',
            borderRadius: theme.borders.borderRadiusSm,
          }}
        >
          <FunctionIcon css={{ color: iconColor }} />
          <Typography.Text css={{ color: `${textColor} !important` }}>{toolCall.function.name}</Typography.Text>
        </div>
        <Tooltip componentId="test" content={toolCall.id}>
          <div css={{ display: 'inline-flex', flexShrink: 1, overflow: 'hidden' }}>
            <Typography.Text
              css={{
                // to make it the same size as the function call
                padding: `2px ${theme.spacing.xs}px`,
                backgroundColor: theme.colors.codeBackground,
                // to avoid the opacity overlapping
                '> code': {
                  background: 'none !important',
                },
                borderRadius: theme.borders.borderRadiusSm,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
              code
              color="secondary"
            >
              {toolCall.id}
            </Typography.Text>
          </div>
        </Tooltip>
      </div>
      <CodeSnippet
        language="json"
        style={{ padding: theme.spacing.sm, marginBottom: theme.spacing.md }}
        showLineNumbers
      >
        {toolCall.function.arguments}
      </CodeSnippet>
    </div>
  );
}
