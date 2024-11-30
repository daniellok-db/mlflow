import {
  ModelsIcon,
  ConnectIcon,
  FileDocumentIcon,
  useDesignSystemTheme,
  SortUnsortedIcon,
  QuestionMarkIcon,
  CodeIcon,
  FunctionIcon,
  NumbersIcon,
  SearchIcon,
  WrenchIcon,
  UserSparkleIcon,
  ChainIcon,
} from '@databricks/design-system';

import { ModelIconType } from './ModelTrace.types';

export const ModelTraceExplorerIcon = ({ type = ModelIconType.CONNECT }: { type?: ModelIconType }) => {
  const { theme } = useDesignSystemTheme();

  const iconMap = {
    [ModelIconType.MODELS]: <ModelsIcon />,
    [ModelIconType.DOCUMENT]: <FileDocumentIcon />,
    [ModelIconType.CONNECT]: <ConnectIcon />,
    [ModelIconType.CODE]: <CodeIcon />,
    [ModelIconType.FUNCTION]: <FunctionIcon />,
    [ModelIconType.NUMBERS]: <NumbersIcon />,
    [ModelIconType.SEARCH]: <SearchIcon />,
    [ModelIconType.SORT]: <SortUnsortedIcon />,
    [ModelIconType.UNKNOWN]: <QuestionMarkIcon />,
    [ModelIconType.WRENCH]: <WrenchIcon />,
    [ModelIconType.AGENT]: <UserSparkleIcon />,
    [ModelIconType.CHAIN]: <ChainIcon />,
  };

  return (
    <div
      css={{
        width: theme.general.iconSize,
        height: theme.general.iconSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.legacyBorders.borderRadiusMd,
        svg: { width: theme.general.iconFontSize, height: theme.general.iconFontSize },
      }}
    >
      {iconMap[type]}
    </div>
  );
};
