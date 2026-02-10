import React, { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  BeakerIcon,
  Button,
  CloudModelIcon,
  DropdownMenu,
  GearIcon,
  HomeIcon,
  ModelsIcon,
  PlusIcon,
  SegmentedControlGroup,
  SegmentedControlButton,
  Tag,
  TextBoxIcon,
  Tooltip,
  useDesignSystemTheme,
  DesignSystemEventProviderComponentTypes,
  DesignSystemEventProviderAnalyticsEventTypes,
  Typography,
} from '@databricks/design-system';
import type { Location } from '../utils/RoutingUtils';
import { Link, matchPath, useLocation, useNavigate } from '../utils/RoutingUtils';
import ExperimentTrackingRoutes from '../../experiment-tracking/routes';
import { ModelRegistryRoutes } from '../../model-registry/routes';
import GatewayRoutes from '../../gateway/routes';
import { CreateExperimentModal } from '../../experiment-tracking/components/modals/CreateExperimentModal';
import { useInvalidateExperimentList } from '../../experiment-tracking/components/experiment-page/hooks/useExperimentListQuery';
import { CreateModelModal } from '../../model-registry/components/CreateModelModal';
import {
  CreatePromptModalMode,
  useCreatePromptModal,
} from '../../experiment-tracking/pages/prompts/hooks/useCreatePromptModal';
import Routes from '../../experiment-tracking/routes';
import { FormattedMessage } from 'react-intl';
import { useLogTelemetryEvent } from '../../telemetry/hooks/useLogTelemetryEvent';
import { useWorkflowType, WorkflowType } from '../contexts/WorkflowTypeContext';
import {
  ExperimentPageSideNavGenAIConfig,
  ExperimentPageSideNavCustomModelConfig,
  getExperimentPageSideNavSectionLabel,
  type ExperimentPageSideNavSectionKey,
  useExperimentPageSideNavConfig,
} from '../../experiment-tracking/pages/experiment-page-tabs/side-nav/constants';
import { ExperimentKind, ExperimentPageTabName } from '../../experiment-tracking/constants';
import { ChainIcon, KeyIcon } from '@databricks/design-system';
import { useParams } from '../utils/RoutingUtils';
import { shouldEnableWorkflowBasedNavigation } from '../utils/FeatureUtils';
import { AssistantSparkleIcon } from '../../assistant/AssistantIconButton';
import { useAssistant } from '../../assistant/AssistantContext';
import { useExperimentEvaluationRunsData } from '../../experiment-tracking/components/experiment-page/hooks/useExperimentEvaluationRunsData';
import { getExperimentKindForWorkflowType } from '../../experiment-tracking/utils/ExperimentKindUtils';
import { MlflowSidebarExperimentItems } from './MlflowSidebarExperimentItems';
import { MlflowSidebarLink } from './MlflowSidebarLink';
import { MlflowSidebarGatewayItems } from './MlflowSidebarGatewayItems';

const isInsideExperiment = (location: Location) =>
  Boolean(matchPath('/experiments/:experimentId/*', location.pathname));
const isHomeActive = (location: Location) => Boolean(matchPath({ path: '/', end: true }, location.pathname));
const isExperimentsActive = (location: Location) =>
  Boolean(
    matchPath({ path: '/experiments', end: true }, location.pathname) ||
    matchPath('/compare-experiments/*', location.pathname),
  );
const isModelsActive = (location: Location) => Boolean(matchPath('/models/*', location.pathname));
const isPromptsActive = (location: Location) => Boolean(matchPath('/prompts/*', location.pathname));
const isGatewayActive = (location: Location) => Boolean(matchPath('/gateway/*', location.pathname));
const isSettingsActive = (location: Location) => Boolean(matchPath('/settings/*', location.pathname));

type MlFlowSidebarMenuDropdownComponentId =
  | 'mlflow_sidebar.create_experiment_button'
  | 'mlflow_sidebar.create_model_button'
  | 'mlflow_sidebar.create_prompt_button';

type NestedMenuItem = {
  key: string;
  icon: React.ReactNode;
  label: React.ReactNode;
  to: string;
  componentId: string;
  isActive: (location: Location) => boolean;
};

type NestedItemsGroup = {
  sectionKey: ExperimentPageSideNavSectionKey;
  items: NestedMenuItem[];
};

type MenuItemWithNested = {
  key: string;
  icon: React.ReactNode;
  linkProps: {
    to: string;
    isActive: (location: Location) => boolean;
    children: React.ReactNode;
  };
  componentId: string;
  dropdownProps?: {
    componentId: MlFlowSidebarMenuDropdownComponentId;
    onClick: () => void;
    children: React.ReactNode;
  };
  nestedItems?: React.ReactNode;
};

const shouldShowGenAIFeatures = (enableWorkflowBasedNavigation: boolean, workflowType: WorkflowType) =>
  !enableWorkflowBasedNavigation || (enableWorkflowBasedNavigation && workflowType === WorkflowType.GENAI);

export function MlflowSidebar() {
  const location = useLocation();
  const { theme } = useDesignSystemTheme();
  const invalidateExperimentList = useInvalidateExperimentList();
  const navigate = useNavigate();
  const viewId = useMemo(() => uuidv4(), []);
  const enableWorkflowBasedNavigation = shouldEnableWorkflowBasedNavigation();
  // WorkflowType context is always available, but UI is guarded by feature flag
  const { workflowType, setWorkflowType } = useWorkflowType();
  const { experimentId } = useParams();
  const logTelemetryEvent = useLogTelemetryEvent();

  // Persist the last selected experiment ID so the nested experiment view
  // stays visible when navigating away from experiment pages
  const lastSelectedExperimentIdRef = useRef<string | null>(null);

  // Update the ref when we're inside an experiment
  if (experimentId && isInsideExperiment(location)) {
    lastSelectedExperimentIdRef.current = experimentId;
  }

  // Callback to clear the persisted experiment ID (used by back button)
  const clearLastSelectedExperiment = useCallback(() => {
    lastSelectedExperimentIdRef.current = null;
  }, []);

  // Use the current experimentId if inside an experiment, otherwise use the persisted one
  const activeExperimentId = isInsideExperiment(location) ? experimentId : lastSelectedExperimentIdRef.current;
  const showNestedExperimentItems = Boolean(activeExperimentId);

  const [showCreateExperimentModal, setShowCreateExperimentModal] = useState(false);
  const [showCreateModelModal, setShowCreateModelModal] = useState(false);
  const { CreatePromptModal, openModal: openCreatePromptModal } = useCreatePromptModal({
    mode: CreatePromptModalMode.CreatePrompt,
    onSuccess: ({ promptName }) => navigate(Routes.getPromptDetailsPageRoute(promptName)),
  });
  const { openPanel, closePanel, isPanelOpen, isLocalServer } = useAssistant();
  const [isAssistantHovered, setIsAssistantHovered] = useState(false);

  const handleAssistantToggle = useCallback(() => {
    if (isPanelOpen) {
      closePanel();
    } else {
      openPanel();
    }
    logTelemetryEvent({
      componentId: 'mlflow.sidebar.assistant_button',
      componentViewId: viewId,
      componentType: DesignSystemEventProviderComponentTypes.Button,
      componentSubType: null,
      eventType: DesignSystemEventProviderAnalyticsEventTypes.OnClick,
    });
  }, [isPanelOpen, closePanel, openPanel, logTelemetryEvent, viewId]);

  const menuItems: MenuItemWithNested[] = useMemo(
    () => [
      {
        key: 'home',
        icon: <HomeIcon />,
        linkProps: {
          to: ExperimentTrackingRoutes.rootRoute,
          isActive: isHomeActive,
          children: <FormattedMessage defaultMessage="Home" description="Sidebar link for home page" />,
        },
        componentId: 'mlflow.sidebar.home_tab_link',
      },
      {
        key: 'experiments',
        icon: <BeakerIcon />,
        linkProps: {
          to: ExperimentTrackingRoutes.experimentsObservatoryRoute,
          isActive: isExperimentsActive,
          children: <FormattedMessage defaultMessage="Experiments" description="Sidebar link for experiments tab" />,
        },
        componentId: 'mlflow.sidebar.experiments_tab_link',
        dropdownProps: {
          componentId: 'mlflow_sidebar.create_experiment_button' as MlFlowSidebarMenuDropdownComponentId,
          onClick: () => setShowCreateExperimentModal(true),
          children: (
            <FormattedMessage
              defaultMessage="Experiment"
              description="Sidebar button inside the 'new' popover to create new experiment"
            />
          ),
        },
        nestedItems:
          shouldEnableWorkflowBasedNavigation() && showNestedExperimentItems ? (
            <MlflowSidebarExperimentItems
              experimentId={activeExperimentId ?? undefined}
              workflowType={workflowType}
              onBackClick={clearLastSelectedExperiment}
            />
          ) : undefined,
      },
      ...(workflowType === WorkflowType.MACHINE_LEARNING || !enableWorkflowBasedNavigation
        ? [
            {
              key: 'models',
              icon: <ModelsIcon />,
              linkProps: {
                to: ModelRegistryRoutes.modelListPageRoute,
                isActive: isModelsActive,
                children: (
                  <FormattedMessage defaultMessage="Model registry" description="Sidebar link for model registry tab" />
                ),
              },
              componentId: 'mlflow.sidebar.models_tab_link',
              dropdownProps: {
                componentId: 'mlflow_sidebar.create_model_button' as MlFlowSidebarMenuDropdownComponentId,
                onClick: () => setShowCreateModelModal(true),
                children: (
                  <FormattedMessage
                    defaultMessage="Model"
                    description="Sidebar button inside the 'new' popover to create new model"
                  />
                ),
              },
            },
          ]
        : []),
      ...(shouldShowGenAIFeatures(enableWorkflowBasedNavigation, workflowType) && !showNestedExperimentItems
        ? [
            {
              key: 'prompts',
              icon: <TextBoxIcon />,
              linkProps: {
                to: ExperimentTrackingRoutes.promptsPageRoute,
                isActive: isPromptsActive,
                children: <FormattedMessage defaultMessage="Prompts" description="Sidebar link for prompts tab" />,
              },
              componentId: 'mlflow.sidebar.prompts_tab_link',
              dropdownProps: {
                componentId: 'mlflow_sidebar.create_prompt_button' as MlFlowSidebarMenuDropdownComponentId,
                onClick: openCreatePromptModal,
                children: (
                  <FormattedMessage
                    defaultMessage="Prompt"
                    description="Sidebar button inside the 'new' popover to create new prompt"
                  />
                ),
              },
            },
          ]
        : []),
      ...(shouldShowGenAIFeatures(enableWorkflowBasedNavigation, workflowType)
        ? [
            {
              key: 'gateway',
              icon: <CloudModelIcon />,
              linkProps: {
                to: GatewayRoutes.gatewayPageRoute,
                isActive: (location: Location) => !enableWorkflowBasedNavigation && isGatewayActive(location),
                children: (
                  <FormattedMessage defaultMessage="AI Gateway" description="Sidebar link for gateway configuration" />
                ),
              },
              componentId: 'mlflow.sidebar.gateway_tab_link',
              nestedItems:
                shouldEnableWorkflowBasedNavigation() && isGatewayActive(location) ? (
                  <MlflowSidebarGatewayItems />
                ) : undefined,
            },
          ]
        : []),
    ],
    [
      enableWorkflowBasedNavigation,
      workflowType,
      openCreatePromptModal,
      activeExperimentId,
      showNestedExperimentItems,
      clearLastSelectedExperiment,
      location,
    ],
  );

  return (
    <aside
      css={{
        width: enableWorkflowBasedNavigation ? 230 : 200,
        flexShrink: 0,
        padding: theme.spacing.sm,
        display: 'inline-flex',
        flexDirection: 'column',
        gap: theme.spacing.md,
      }}
    >
      {enableWorkflowBasedNavigation && (
        <SegmentedControlGroup
          value={workflowType}
          onChange={(e) => {
            if (e.target.value) {
              setWorkflowType(e.target.value as WorkflowType);
            }
          }}
          name="workflow-type-selector"
          componentId="mlflow.sidebar.workflow_type_selector"
          css={{ width: '100%', display: 'flex' }}
        >
          <SegmentedControlButton value={WorkflowType.GENAI}>
            <FormattedMessage defaultMessage="GenAI" description="Label for GenAI workflow type option" />
          </SegmentedControlButton>
          <SegmentedControlButton value={WorkflowType.MACHINE_LEARNING} css={{ whiteSpace: 'nowrap' }}>
            <FormattedMessage
              defaultMessage="Machine Learning"
              description="Label for Machine Learning workflow type option"
            />
          </SegmentedControlButton>
        </SegmentedControlGroup>
      )}

      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger asChild>
          <Button componentId="mlflow.sidebar.new_button" icon={<PlusIcon />}>
            <FormattedMessage
              defaultMessage="New"
              description="Sidebar create popover button to create new experiment, model or prompt"
            />
          </Button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content side="right" sideOffset={theme.spacing.sm} align="start">
          {menuItems
            .filter((item) => item.dropdownProps !== undefined)
            .map(({ key, icon, dropdownProps }) => (
              <DropdownMenu.Item
                key={key}
                componentId={(dropdownProps?.componentId ?? `${key}-dropdown-item`) as string}
                onClick={dropdownProps?.onClick}
              >
                <DropdownMenu.IconWrapper>{icon}</DropdownMenu.IconWrapper>
                {dropdownProps?.children}
              </DropdownMenu.Item>
            ))}
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <nav css={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
        <ul
          css={{
            listStyleType: 'none',
            padding: 0,
            margin: 0,
          }}
        >
          {menuItems.map(
            ({ key, icon, linkProps, componentId, nestedItems }) =>
              nestedItems ?? (
                <MlflowSidebarLink to={linkProps.to} componentId={componentId} isActive={linkProps.isActive}>
                  {icon}
                  {linkProps.children}
                </MlflowSidebarLink>
              ),
          )}
        </ul>
        <div>
          {isLocalServer && (
            <div
              css={{
                padding: 2,
                marginBottom: theme.spacing.xs,
                borderRadius: theme.borders.borderRadiusMd,
                background:
                  'linear-gradient(90deg, rgba(232, 72, 85, 0.7), rgba(155, 93, 229, 0.7), rgba(67, 97, 238, 0.7))',
              }}
            >
              <div
                role="button"
                tabIndex={0}
                aria-pressed={isPanelOpen}
                css={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  paddingInline: theme.spacing.md,
                  paddingBlock: theme.spacing.xs,
                  borderRadius: theme.borders.borderRadiusMd - 2,
                  cursor: 'pointer',
                  background: theme.colors.backgroundSecondary,
                  color: isPanelOpen ? theme.colors.actionDefaultIconHover : theme.colors.actionDefaultIconDefault,
                }}
                onClick={handleAssistantToggle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleAssistantToggle();
                  }
                }}
                onMouseEnter={() => setIsAssistantHovered(true)}
                onMouseLeave={() => setIsAssistantHovered(false)}
              >
                <AssistantSparkleIcon isHovered={isAssistantHovered} />
                <Typography.Text color="primary">
                  <FormattedMessage defaultMessage="Assistant" description="Sidebar button for AI assistant" />
                </Typography.Text>
                <Tag componentId="mlflow.sidebar.assistant_beta_tag" color="turquoise" css={{ marginLeft: 'auto' }}>
                  Beta
                </Tag>
              </div>
            </div>
          )}
          <MlflowSidebarLink
            to={ExperimentTrackingRoutes.settingsPageRoute}
            componentId="mlflow.sidebar.settings_tab_link"
            isActive={isSettingsActive}
          >
            <GearIcon />
            <FormattedMessage defaultMessage="Settings" description="Sidebar link for settings page" />
          </MlflowSidebarLink>
        </div>
      </nav>

      <CreateExperimentModal
        isOpen={showCreateExperimentModal}
        onClose={() => setShowCreateExperimentModal(false)}
        onExperimentCreated={invalidateExperimentList}
      />
      <CreateModelModal modalVisible={showCreateModelModal} hideModal={() => setShowCreateModelModal(false)} />
      {CreatePromptModal}
    </aside>
  );
}
