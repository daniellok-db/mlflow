import React, { useEffect, useRef } from 'react';

import { useDesignSystemTheme, Typography, ChevronDownIcon, ChevronRightIcon, Button } from '@databricks/design-system';
import { FeedbackLink } from '@databricks/web-shared/fastfeedback';
import { Es, useReactInteractionTracing, AlertUtils } from '@databricks/web-shared/metrics';
import { useRecordEvent } from '@databricks/web-shared/metrics/useRecordEvent';
import { useRecordProto } from '@databricks/web-shared/metrics/useRecordProto';
import {
  ModelTraceExplorer,
  ModelTraceChildToParentFrameMessage,
  ModelTraceParentToChildFrameMessage,
} from '@databricks/web-shared/model-trace-explorer';
import type { ModelTrace, ModelTraceChildToParentFrameMessageType } from '@databricks/web-shared/model-trace-explorer';
import { useDesignSystemEventCallback } from '@databricks/web-shared/observability/analytics/useDesignSystemEventCallback';

import { findTraceVersionByKey } from '../ModelTraceExplorer.utils';
import rendererVersions from '../ml-model-trace-renderer/library-versions.json';

const FALLBACK_VERSION = '2';

const TITLE_BAR_HEIGHT = 36;

export const getTraceVersion = (modelTrace: ModelTrace): string => {
  // attempt to retrieve the version from request metadata
  const versionFromRequest = findTraceVersionByKey(modelTrace?.info?.request_metadata);
  if (versionFromRequest) {
    return versionFromRequest;
  }

  // if that fails, attempt to retrieve the version from tags
  // (this is the old way of storing the version). if it's not
  // here either, then this is a pre-public preview trace that
  // should be renderable with the fallback.
  return findTraceVersionByKey(modelTrace?.info?.tags) ?? FALLBACK_VERSION;
};

export const ModelTraceExplorerFrameRenderer = ({
  modelTrace,
  height = 700,
  useLatestVersion = false,
}: {
  modelTrace: ModelTrace;
  height?: number | string;
  useLatestVersion?: boolean;
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [expanded, setExpanded] = React.useState(true);
  const version = useLatestVersion ? 'current' : getTraceVersion(modelTrace);
  const rendererVersionSrc = (rendererVersions as any)[version]?.path ?? rendererVersions[FALLBACK_VERSION].path;

  const recordEvent = useRecordEvent();
  const recordProto = useRecordProto();
  const { startInteraction } = useReactInteractionTracing();
  const { theme } = useDesignSystemTheme();

  const eventServiceCallback = useDesignSystemEventCallback({
    recordEvent,
    recordProto,
    startInteraction,
  });

  useEffect(() => {
    const handleMessage = (event: MessageEvent<ModelTraceChildToParentFrameMessageType>) => {
      // only handle messages from the child iframe
      const iframeWindow = iframeRef.current?.contentWindow;
      if (!iframeWindow || event.source !== iframeWindow) {
        return;
      }

      switch (event.data.type) {
        case ModelTraceChildToParentFrameMessage.Ready: {
          setIsLoading(false);
          break;
        }
        case ModelTraceChildToParentFrameMessage.LogError: {
          // Intercept errors from the iFrame and send them to regular error logging logic.
          // If it's a promise, add relevant metric flag.
          const { error } = event.data || {};
          AlertUtils.sev2(Es.MlExperiments, 'ModelTraceExplorerFrameRenderer/Error', error);

          break;
        }
        case ModelTraceChildToParentFrameMessage.LogEvent: {
          // Intercept UI usage events from the iFrame
          const eventDefaultPrevented = event.data.payload.eventDefaultPrevented;
          eventServiceCallback({
            ...event.data.payload,
            skip: eventDefaultPrevented,
          });
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [eventServiceCallback]);

  useEffect(() => {
    const iframeWindow = iframeRef.current?.contentWindow;
    if (!iframeWindow || isLoading) {
      return;
    }

    iframeWindow.postMessage({
      type: ModelTraceParentToChildFrameMessage.UpdateTrace,
      traceData: modelTrace,
    });
  }, [modelTrace, isLoading]);

  return (
    <div
      css={{
        height: expanded ? height : TITLE_BAR_HEIGHT,
        borderTop: `1px solid ${theme.colors.border}`,
      }}
    >
      <div
        css={{
          display: 'flex',
          height: TITLE_BAR_HEIGHT,
          justifyContent: 'space-between',
          padding: theme.spacing.sm,
        }}
      >
        <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          <Button
            componentId={`mlflow.notebook.trace-ui-${expanded ? 'collapse' : 'expand'}`}
            icon={expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
            size="small"
            onClick={() => setExpanded(!expanded)}
          />
          <Typography.Title level={4} withoutMargins>
            MLflow Trace UI
          </Typography.Title>
          <Typography.Link
            componentId="mlflow.notebook.trace-ui-learn-more-link"
            href="https://mlflow.org/docs/latest/llms/tracing/index.html"
            openInNewTab={true}
            title="Learn More"
          >
            Learn More
          </Typography.Link>
        </div>
        <FeedbackLink parentUi={Es.MlFlowOSS} origin="mlflow-notebook-trace-ui" />
      </div>
      {isLoading && (
        <div
          css={{
            position: 'absolute',
            width: '100%',
            height,
          }}
        >
          <ModelTraceExplorer.Skeleton label="Frame Skeleton" />
        </div>
      )}
      <iframe
        title="Model Trace Explorer"
        src={rendererVersionSrc}
        ref={iframeRef}
        css={{
          border: 'none',
          width: '100%',
          height: `calc(100% - ${TITLE_BAR_HEIGHT}px)`,
          display: expanded ? 'block' : 'none',
        }}
      />
    </div>
  );
};
