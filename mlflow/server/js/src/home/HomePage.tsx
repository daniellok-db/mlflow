import { useState, lazy, Suspense } from 'react';
import { Header, Spinner, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage } from 'react-intl';
import { ScrollablePageWrapper } from '../common/components/ScrollablePageWrapper';
import { useQuery } from '@mlflow/mlflow/src/common/utils/reactQueryHooks';
import { MlflowService } from '../experiment-tracking/sdk/MlflowService';
import type { SearchExperimentsApiResponse } from '../experiment-tracking/types';
import { CreateExperimentModal } from '../experiment-tracking/components/modals/CreateExperimentModal';
import { useInvalidateExperimentList } from '../experiment-tracking/components/experiment-page/hooks/useExperimentListQuery';
import { HomePageViewStateProvider } from './HomePageViewStateContext';

const GetStarted = lazy(() => import('./components/GetStarted').then(({ GetStarted }) => ({ default: GetStarted })));
const ExperimentsHomeView = lazy(() =>
  import('./components/ExperimentsHomeView').then(({ ExperimentsHomeView }) => ({ default: ExperimentsHomeView })),
);
const DiscoverNews = lazy(() =>
  import('./components/DiscoverNews').then(({ DiscoverNews }) => ({ default: DiscoverNews })),
);
const LogTracesDrawer = lazy(() =>
  import('./components/LogTracesDrawer').then(({ LogTracesDrawer }) => ({ default: LogTracesDrawer })),
);

type ExperimentQueryKey = ['home', 'recent-experiments'];

const RECENT_EXPERIMENTS_QUERY_KEY: ExperimentQueryKey = ['home', 'recent-experiments'];

const HomePageContent = () => {
  const { theme } = useDesignSystemTheme();
  const invalidateExperiments = useInvalidateExperimentList();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data, error, isLoading, refetch } = useQuery<
    SearchExperimentsApiResponse,
    Error,
    SearchExperimentsApiResponse,
    ExperimentQueryKey
  >(RECENT_EXPERIMENTS_QUERY_KEY, {
    queryFn: () =>
      MlflowService.searchExperiments([
        ['max_results', '5'],
        ['order_by', 'last_update_time DESC'],
      ]),
    staleTime: 30_000,
  });

  const experiments = data?.experiments;

  const handleOpenCreateModal = () => setIsCreateModalOpen(true);
  const handleCloseCreateModal = () => setIsCreateModalOpen(false);
  const handleExperimentCreated = () => {
    handleCloseCreateModal();
    invalidateExperiments();
    refetch();
  };

  return (
    <ScrollablePageWrapper
      css={{
        padding: theme.spacing.md,
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.lg,
        height: 'min-content',
      }}
    >
      <Header title={<FormattedMessage defaultMessage="Welcome to MLflow" description="Home page hero title" />} />
      <Suspense fallback={<Spinner />}>
        <GetStarted />
      </Suspense>
      <Suspense fallback={<Spinner />}>
        <ExperimentsHomeView
          experiments={experiments}
          isLoading={isLoading}
          error={error}
          onCreateExperiment={handleOpenCreateModal}
          onRetry={refetch}
        />
      </Suspense>
      <Suspense fallback={<Spinner />}>
        <DiscoverNews />
      </Suspense>

      <CreateExperimentModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onExperimentCreated={handleExperimentCreated}
      />
      <Suspense fallback={<Spinner />}>
        <LogTracesDrawer />
      </Suspense>
    </ScrollablePageWrapper>
  );
};

const HomePage = () => (
  <HomePageViewStateProvider>
    <HomePageContent />
  </HomePageViewStateProvider>
);

export default HomePage;
