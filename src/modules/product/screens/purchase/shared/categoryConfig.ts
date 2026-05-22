export const CATEGORY_CONFIG: Record<
  string,
  { title: string; subTitle: string; bg: ReturnType<typeof require>; backColor: string }
> = {
  HAPPI_CYBER: {
    title: 'Cyber Insurance',
    subTitle: 'Your All-in-One Digital Safety Net!',
    bg: require('../../../../../../assets/products/header-bg-cyber.png'),
    backColor: '#FFFFFF',
  },
  HAPPI_HOME: {
    title: 'Home Content Insurance',
    subTitle: 'Your Belongings Deserve a Bodyguard!',
    bg: require('../../../../../../assets/products/header-bg-home.png'),
    backColor: '#FDB813',
  },
  HAPPI_TRAVEL: {
    title: 'Travel Insurance',
    subTitle: 'Explore the World with Confidence!',
    bg: require('../../../../../../assets/products/header-bg-travel.png'),
    backColor: '#FFFFFF',
  },
};

export const DEFAULT_CONFIG = {
  title: 'Insurance',
  subTitle: '',
  bg: require('../../../../../../assets/products/header-bg.png'),
  backColor: '#FFFFFF',
};
