import { v4 as uuidv4 } from 'uuid';
import type { Location } from '../utils/RoutingUtils';
import { Link, useLocation } from '../utils/RoutingUtils';
import {
  DesignSystemEventProviderAnalyticsEventTypes,
  DesignSystemEventProviderComponentTypes,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { useLogTelemetryEvent } from '../../telemetry/hooks/useLogTelemetryEvent';
import { useMemo } from 'react';

export const MlflowSidebarLink = ({
  className,
  to,
  componentId,
  children,
  isActive,
  onClick,
}: {
  className?: string;
  to: string;
  componentId: string;
  children: React.ReactNode;
  isActive: (location: Location) => boolean;
  onClick?: () => void;
}) => {
  const { theme } = useDesignSystemTheme();
  const logTelemetryEvent = useLogTelemetryEvent();
  const viewId = useMemo(() => uuidv4(), []);
  const location = useLocation();

  return (
    <li key={componentId}>
      <Link
        to={to}
        aria-current={isActive(location) ? 'page' : undefined}
        className={className}
        css={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          color: theme.colors.textPrimary,
          paddingInline: theme.spacing.md,
          paddingBlock: theme.spacing.xs,
          borderRadius: theme.borders.borderRadiusSm,
          '&:hover': {
            color: theme.colors.actionLinkHover,
            backgroundColor: theme.colors.actionDefaultBackgroundHover,
          },
          '&[aria-current="page"]': {
            backgroundColor: theme.colors.actionDefaultBackgroundPress,
            color: theme.isDarkMode ? theme.colors.blue300 : theme.colors.blue700,
            fontWeight: theme.typography.typographyBoldFontWeight,
          },
        }}
        onClick={() => {
          logTelemetryEvent({
            componentId,
            componentViewId: viewId,
            componentType: DesignSystemEventProviderComponentTypes.Button,
            componentSubType: null,
            eventType: DesignSystemEventProviderAnalyticsEventTypes.OnClick,
          });
          onClick?.();
        }}
      >
        {children}
      </Link>
    </li>
  );
};
