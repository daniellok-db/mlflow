import { isNil } from 'lodash';
import { useMemo, useState } from 'react';

import {
  Button,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  GearIcon,
  ModelsIcon,
  Tooltip,
  Typography,
  useDesignSystemTheme,
  UserIcon,
  WrenchIcon,
} from '@databricks/design-system';
import { FormattedMessage } from '@databricks/i18n';
import { GenAIMarkdownRenderer } from '@databricks/web-shared/genai-markdown-renderer';

import { ModelTraceExplorerToolCallMessage } from './ModelTraceExplorerToolCallMessage';
import type { ModelTraceChatMessage } from '../ModelTrace.types';

const CONTENT_TRUNCATION_LIMIT = 300;

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'system':
      return <GearIcon />;
    case 'user':
      return <UserIcon />;
    case 'tool':
    case 'function':
      return <WrenchIcon />;
    default:
      return <ModelsIcon />;
  }
};

const getRoleDisplayText = (role: string) => {
  switch (role) {
    case 'system':
      return (
        <FormattedMessage
          defaultMessage="System"
          description="Display text for the 'system' role in a GenAI chat message."
        />
      );
    case 'user':
      return (
        <FormattedMessage
          defaultMessage="User"
          description="Display text for the 'user' role in a GenAI chat message."
        />
      );
    case 'assistant':
      return (
        <FormattedMessage
          defaultMessage="Assistant"
          description="Display text for the 'assistant' role in a GenAI chat message."
        />
      );
    case 'tool':
      return (
        <FormattedMessage
          defaultMessage="Tool"
          description="Display text for the 'tool' role in a GenAI chat message."
        />
      );
    case 'function':
      return (
        <FormattedMessage
          defaultMessage="Function"
          description="Display text for the 'function' role in a GenAI chat message."
        />
      );
    default:
      return role;
  }
};

export function ModelTraceExplorerChatMessage({
  message,
  className,
}: {
  message: ModelTraceChatMessage;
  className?: string;
}) {
  const { theme } = useDesignSystemTheme();
  const [expanded, setExpanded] = useState(false);
  const shouldTruncate = (message.content?.length ?? 0) > CONTENT_TRUNCATION_LIMIT;

  const hoverStyles = useMemo(
    () =>
      shouldTruncate
        ? {
            ':hover': {
              backgroundColor: theme.colors.actionIconBackgroundHover,
              cursor: 'pointer',
            },
          }
        : {},
    [theme, shouldTruncate],
  );

  const displayedContent =
    shouldTruncate && !expanded ? `${message.content?.slice(0, CONTENT_TRUNCATION_LIMIT)}...` : message.content;

  return (
    <div
      css={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        borderRadius: theme.borders.borderRadiusMd,
        border: `1px solid ${theme.colors.border}`,
      }}
      className={className}
    >
      <div
        role="button"
        css={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.backgroundSecondary,
          borderTopLeftRadius: theme.borders.borderRadiusMd,
          borderTopRightRadius: theme.borders.borderRadiusMd,
          borderBottom: `1px solid ${theme.colors.border}`,
          padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
          gap: theme.spacing.sm,
          ...hoverStyles,
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {shouldTruncate && (expanded ? <ChevronDownIcon /> : <ChevronRightIcon />)}
        {getRoleIcon(message.role)}
        <Typography.Text bold>{getRoleDisplayText(message.role)}</Typography.Text>
        {message.tool_call_id && (
          <Tooltip componentId="test" content={message.tool_call_id}>
            <div css={{ display: 'inline-flex', flexShrink: 1, overflow: 'hidden' }}>
              <Typography.Text css={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} code>
                {message.tool_call_id}
              </Typography.Text>
            </div>
          </Tooltip>
        )}
      </div>
      <div
        css={{
          padding: theme.spacing.md,
          marginBottom: -theme.typography.fontSizeBase,
        }}
      >
        {!isNil(message.tool_calls) &&
          message.tool_calls.map((toolCall) => (
            <ModelTraceExplorerToolCallMessage key={toolCall.id} toolCall={toolCall} />
          ))}
        {message.content && <GenAIMarkdownRenderer>{displayedContent ?? ''}</GenAIMarkdownRenderer>}
      </div>
      {shouldTruncate && (
        <Button
          componentId={
            expanded
              ? 'shared.model-trace-explorer.chat-message-see-less'
              : 'shared.model-trace-explorer.chat-message-see-more'
          }
          icon={expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          type="tertiary"
          onClick={() => setExpanded(!expanded)}
          css={{
            display: 'flex',
            width: '100%',
            padding: theme.spacing.md,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          }}
        >
          {expanded ? (
            <FormattedMessage
              defaultMessage="See less"
              description="A button label in a message renderer that truncates long content when clicked."
            />
          ) : (
            <FormattedMessage
              defaultMessage="See more"
              description="A button label in a message renderer that expands truncated content when clicked."
            />
          )}
        </Button>
      )}
    </div>
  );
}
