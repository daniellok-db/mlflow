import { ConnectIcon, FileDocumentIcon, ModelsIcon } from '@databricks/design-system';
import { HackyStorybookSafexTopLevelSetter } from '@databricks/web-shared/flags/test-utils';

import { TimelineTree } from '.';
import { useTimelineTreeExpandedNodes, useTimelineTreeSelectedNode } from './TimelineTree.utils';
import { ModelSpanType, type ModelTraceSpanNode } from '../ModelTrace.types';

const sampleRootNode: ModelTraceSpanNode = {
  title: 'document-qa-chain',
  key: 'document-qa-chain',
  icon: <ModelsIcon />,
  start: 0,
  end: 4200,
  type: ModelSpanType.FUNCTION,
  children: [
    {
      title: '_generate_response',
      key: '_generate_response_1',
      icon: <ConnectIcon />,
      start: 0,
      end: 1100,
      type: ModelSpanType.FUNCTION,
      children: [
        {
          key: 'rephrase_chat_to_queue_1',
          title: 'rephrase_chat_to_queue',
          icon: <FileDocumentIcon />,
          start: 0,
          end: 300,
          type: ModelSpanType.FUNCTION,
        },
        {
          key: 'similarity_search_1',
          title: 'similarity_search',
          icon: <FileDocumentIcon />,
          start: 300,
          end: 700,
          type: ModelSpanType.FUNCTION,
        },
        {
          key: '_get_query_messages_1',
          title: '_get_query_messages',
          icon: <FileDocumentIcon />,
          start: 700,
          end: 800,
          type: ModelSpanType.FUNCTION,
        },
        {
          key: '_get_token_count_1',
          title: '_get_token_count',
          icon: <ConnectIcon />,
          start: 800,
          end: 900,
          type: ModelSpanType.FUNCTION,
        },
        {
          key: 'query_llm_1',
          title: 'query_llm',
          icon: <ModelsIcon />,
          start: 900,
          end: 1100,
          type: ModelSpanType.FUNCTION,
        },
      ],
    },
    {
      title: '_generate_response',
      key: '_generate_response_3',
      icon: <ConnectIcon />,
      start: 1100,
      end: 2400,
      type: ModelSpanType.FUNCTION,
      children: [
        {
          key: 'rephrase_chat_to_queue_3',
          title: 'rephrase_chat_to_queue',
          icon: <FileDocumentIcon />,
          start: 1100,
          end: 1200,
          type: ModelSpanType.FUNCTION,
        },
        {
          key: 'similarity_search_3',
          title: 'similarity_search',
          icon: <FileDocumentIcon />,
          start: 1200,
          end: 1800,
          type: ModelSpanType.FUNCTION,
        },
        {
          key: '_get_query_messages_3',
          title: '_get_query_xx_messages',
          icon: <FileDocumentIcon />,
          start: 1800,
          end: 1900,
          type: ModelSpanType.FUNCTION,
        },
        {
          key: '_get_token_count_3',
          title: '_get_token_count',
          icon: <ConnectIcon />,
          start: 1900,
          end: 2000,
          type: ModelSpanType.FUNCTION,
        },
        {
          key: 'query_llm_3',
          title: 'query_llm_xx',
          icon: <ModelsIcon />,
          start: 2000,
          end: 2400,
          type: ModelSpanType.FUNCTION,
        },
      ],
    },
    {
      title: '_generate_response',
      key: '_generate_response_5',
      icon: <ConnectIcon />,
      start: 2400,
      end: 4200,
      type: ModelSpanType.FUNCTION,
      children: [
        {
          key: 'rephrase_chat_to_queue_5',
          title: 'rephrase_chat_to_queue',
          icon: <FileDocumentIcon />,
          start: 2400,
          end: 2600,
          type: ModelSpanType.FUNCTION,
        },
        {
          key: 'similarity_search_5',
          title: 'similarity_search',
          icon: <FileDocumentIcon />,
          start: 2600,
          end: 3100,
          type: ModelSpanType.FUNCTION,
        },
        {
          key: '_get_query_messages_5',
          title: '_get_query_xx_messages',
          icon: <FileDocumentIcon />,
          start: 3100,
          end: 3200,
          type: ModelSpanType.FUNCTION,
        },
        {
          key: '_get_token_count_5',
          title: '_get_token_count',
          icon: <ConnectIcon />,
          start: 3200,
          end: 4000,
          type: ModelSpanType.FUNCTION,
        },
        {
          key: 'query_llm_5',
          title: 'query_llm_xx',
          icon: <ModelsIcon />,
          start: 4000,
          end: 4200,
          type: ModelSpanType.FUNCTION,
        },
      ],
    },
  ],
};

const useTimelineTreeStoryProps = (initialExpandAll = false) => {
  const expandedNodeProps = useTimelineTreeExpandedNodes({ rootNodes: [sampleRootNode], initialExpandAll });
  const selectedNodeProps = useTimelineTreeSelectedNode();
  return { ...expandedNodeProps, ...selectedNodeProps, treeHeader: 'Task name', rootNodes: [sampleRootNode] };
};

const StoryWrapper = ({ children }: { children: React.ReactElement }) => (
  <HackyStorybookSafexTopLevelSetter safexConfig={{}}>
    <>
      <div css={{ marginBottom: 32 }}>
        <code>&lt;TimelineTree&gt;</code> is used to visualize a timeline of tasks in an expandable tree structure.
      </div>
      {children}
    </>
  </HackyStorybookSafexTopLevelSetter>
);

export const Basic = () => (
  <StoryWrapper>
    <TimelineTree {...useTimelineTreeStoryProps()} />
  </StoryWrapper>
);

export const AutomaticallyExpandAll = () => (
  <StoryWrapper>
    <TimelineTree {...useTimelineTreeStoryProps(true)} />
  </StoryWrapper>
);

export const LimitedHeight = () => (
  <StoryWrapper>
    <div css={{ height: 200, border: '1px solid #ccc' }}>
      <TimelineTree {...useTimelineTreeStoryProps(true)} />
    </div>
  </StoryWrapper>
);

const storyConfig = {
  title: 'Model trace explorer/Timeline tree',
  component: null,
  argTypes: {},
  args: {},
};

export default storyConfig;
