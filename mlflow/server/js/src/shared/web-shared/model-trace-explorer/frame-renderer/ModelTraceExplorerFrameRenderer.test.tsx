import { render, screen } from '@testing-library/react';
import React from 'react';

import { ModelTraceExplorerFrameRenderer, getTraceVersion } from './ModelTraceExplorerFrameRenderer';
import type { ModelTrace, ModelTraceInfo, NotebookModelTraceInfo } from '../ModelTrace.types';
import { MLFLOW_TRACE_SCHEMA_VERSION_KEY } from '../ModelTrace.types';
import { MOCK_TRACE } from '../ModelTraceExplorer.test-utils';
import rendererVersions from '../ml-model-trace-renderer/library-versions.json';

// backward compatibility tests for all possible trace versions
const TRACE_V1_RUNS_METADATA: ModelTrace = {
  ...MOCK_TRACE,
  info: {
    ...MOCK_TRACE.info,
    request_metadata: [{ key: MLFLOW_TRACE_SCHEMA_VERSION_KEY, value: '1' }],
  } as ModelTraceInfo,
};

const TRACE_V1_RUNS_TAGS: ModelTrace = {
  ...MOCK_TRACE,
  info: {
    ...MOCK_TRACE.info,
    tags: [{ key: MLFLOW_TRACE_SCHEMA_VERSION_KEY, value: '1' }],
  } as ModelTraceInfo,
};

const TRACE_V1_NOTEBOOK_METADATA: ModelTrace = {
  ...MOCK_TRACE,
  info: {
    ...MOCK_TRACE.info,
    request_metadata: { [MLFLOW_TRACE_SCHEMA_VERSION_KEY]: '1' },
  } as NotebookModelTraceInfo,
};

const TRACE_V1_NOTEBOOK_TAGS: ModelTrace = {
  ...MOCK_TRACE,
  info: {
    ...MOCK_TRACE.info,
    tags: { [MLFLOW_TRACE_SCHEMA_VERSION_KEY]: '1' },
  } as NotebookModelTraceInfo,
};

const TRACE_V2_RUNS_METADATA: ModelTrace = {
  ...MOCK_TRACE,
  info: {
    ...MOCK_TRACE.info,
    request_metadata: [{ key: MLFLOW_TRACE_SCHEMA_VERSION_KEY, value: '2' }],
  } as ModelTraceInfo,
};

const TRACE_V2_RUNS_TAGS: ModelTrace = {
  ...MOCK_TRACE,
  info: {
    ...MOCK_TRACE.info,
    tags: [{ key: MLFLOW_TRACE_SCHEMA_VERSION_KEY, value: '2' }],
  } as ModelTraceInfo,
};

const TRACE_V2_NOTEBOOK_METADATA: ModelTrace = {
  ...MOCK_TRACE,
  info: {
    ...MOCK_TRACE.info,
    request_metadata: { MLFLOW_TRACE_SCHEMA_VERSION_KEY: '2' },
  } as NotebookModelTraceInfo,
};

const TRACE_V2_NOTEBOOK_TAGS: ModelTrace = {
  ...MOCK_TRACE,
  info: {
    ...MOCK_TRACE.info,
    tags: { MLFLOW_TRACE_SCHEMA_VERSION_KEY: '2' },
  } as NotebookModelTraceInfo,
};

const TRACE_V0: ModelTrace = MOCK_TRACE;

const ALL_TRACES: [string, ModelTrace, string, string][] = [
  // Versions with no corresponding renderer, should use fallback
  ['TRACE_V1_RUNS_METADATA', TRACE_V1_RUNS_METADATA, '1', rendererVersions[2].path],
  ['TRACE_V1_RUNS_TAGS', TRACE_V1_RUNS_TAGS, '1', rendererVersions[2].path],
  ['TRACE_V1_NOTEBOOK_METADATA', TRACE_V1_NOTEBOOK_METADATA, '1', rendererVersions[2].path],
  ['TRACE_V1_NOTEBOOK_TAGS', TRACE_V1_NOTEBOOK_TAGS, '1', rendererVersions[2].path],
  ['TRACE_V0', TRACE_V0, '2', rendererVersions[2].path],

  // Versions with corresponding renderer
  ['TRACE_V2_RUNS_METADATA', TRACE_V2_RUNS_METADATA, '2', rendererVersions[2].path],
  ['TRACE_V2_RUNS_TAGS', TRACE_V2_RUNS_TAGS, '2', rendererVersions[2].path],
  ['TRACE_V2_NOTEBOOK_METADATA', TRACE_V2_NOTEBOOK_METADATA, '2', rendererVersions[2].path],
  ['TRACE_V2_NOTEBOOK_TAGS', TRACE_V2_NOTEBOOK_TAGS, '2', rendererVersions[2].path],
];

describe('ModelTraceExplorerFrameRenderer', () => {
  it.each(ALL_TRACES)('parses the version number correctly (%s)', (_, trace: ModelTrace, expectedVersion: string) => {
    expect(getTraceVersion(trace)).toBe(expectedVersion);
  });

  it.each(ALL_TRACES)(
    'renders all types of traces with correct renderer without crashing (%s)',
    (_, trace, __, expectedRendererPath) => {
      render(<ModelTraceExplorerFrameRenderer modelTrace={trace} />);

      expect(screen.getByTitle('Model Trace Explorer')).toBeInTheDocument();
      expect(screen.getByTitle('Model Trace Explorer')).toHaveAttribute('src', expectedRendererPath);
    },
  );

  it('renders current renderer version', () => {
    render(<ModelTraceExplorerFrameRenderer modelTrace={TRACE_V0} useLatestVersion />);

    expect(screen.getByTitle('Model Trace Explorer')).toBeInTheDocument();
    expect(screen.getByTitle('Model Trace Explorer')).toHaveAttribute('src', rendererVersions.current.path);
  });
});
