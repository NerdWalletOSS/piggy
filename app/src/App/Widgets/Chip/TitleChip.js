import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'aphrodite/no-important';
import styles, {
  getGenericTagStyle,
} from '@plugins/Standard/EventLog/EventLogStyles';
import { getItemTitle } from '@plugins/Standard/EventLog/utils';
import { searchItemProps } from '@widgets/SearchableDetailsPane/SearchProps';
import ChipWrapper from './ChipWrapper';

const TitleChip = ({ item, chipClicked, chipStyle, title }) => {
  const { colorHint } = item;
  const titleChipStyle = getGenericTagStyle(colorHint);
  title = title || getItemTitle(item);

  return (
    <ChipWrapper key={`${item.id}-title`}>
      <div
        className={css([styles.chip, titleChipStyle, chipStyle])}
        onClick={() => chipClicked()}
        key="title"
      >
        {title}
      </div>
    </ChipWrapper>
  );
};

TitleChip.propTypes = {
  item: searchItemProps.isRequired,
  chipClicked: PropTypes.func,
  chipStyle: PropTypes.object,
  title: PropTypes.string,
};

TitleChip.defaultProps = {
  chipClicked: () => {},
  chipStyle: {},
  title: undefined,
};

export default TitleChip;
