import { FileDocumentIcon, Tag, Tooltip, Typography, useDesignSystemTheme } from '@databricks/design-system';

import { KeyValueTag } from '../key-value-tag/KeyValueTag';

export function ModelTraceExplorerRetrieverDocumentPreview({
  text,
  metadataTags,
  setExpanded,
}: {
  text: string;
  metadataTags: { key: string; value: string }[];
  setExpanded: (expanded: boolean) => void;
}) {
  const { theme } = useDesignSystemTheme();

  return (
    <div
      role="button"
      onClick={() => {
        setExpanded(true);
      }}
      css={{
        display: 'flex',
        flexDirection: 'row',
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: theme.colors.backgroundSecondary,
        },
      }}
    >
      <div
        css={{
          display: 'flex',
          flexDirection: 'row',
          gap: theme.spacing.sm,
          alignItems: 'center',
          minWidth: 0,
          flexShrink: 1,
        }}
      >
        <FileDocumentIcon />
        <Typography.Text ellipsis size="md">
          {text}
        </Typography.Text>
      </div>
      <div
        css={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        {metadataTags.length > 0 ? (
          <KeyValueTag itemKey={metadataTags[0].key} itemValue={metadataTags[0].value} />
        ) : null}
        {metadataTags.length > 1 ? (
          <Tooltip
            componentId="shared.model-trace-explorer.tag-count.hover-tooltip"
            content={metadataTags.slice(1).map(({ key, value }) => (
              <span key={key} css={{ display: 'inline-block' }}>
                {`${key}: ${value}`}
              </span>
            ))}
          >
            <Tag componentId="shared.model-trace-explorer.tag-count" css={{ whiteSpace: 'nowrap' }}>
              +{metadataTags.length - 1}
            </Tag>
          </Tooltip>
        ) : null}
      </div>
    </div>
  );
}
