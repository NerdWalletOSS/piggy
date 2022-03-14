import React, { useContext } from 'react';
import { css } from 'aphrodite/no-important';
import PropTypes from 'prop-types';
import {
  faApple,
  faAndroid,
  faJsSquare,
} from '@fortawesome/free-brands-svg-icons';
import { faQuestionCircle } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { BackendContext } from '@app/BackendContext';
import styles from './DevicesStyles';

const TYPE_TO_ICON_MAP = {
  android: faAndroid,
  ios: faApple,
  javascript: faJsSquare,
};

const DEFAULT_ICON = faQuestionCircle;

const TYPE_TO_SORT_ORDER_MAP = {
  android: 1,
  ios: 2,
  javascript: 3,
};

const sortKey = (client) =>
  `${client.deviceId}-${
    TYPE_TO_SORT_ORDER_MAP[client.type] || 0
  }`.toLocaleLowerCase();

const sortClients = (clients) =>
  clients.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

export const getIconForClient = (client) =>
  TYPE_TO_ICON_MAP[client.type] || DEFAULT_ICON;

const ClientRow = ({ client }) => (
  <div
    style={{ userSelect: 'text' }}
    key={client.id}
    className={css(styles.devicesBlockListRow)}
  >
    <FontAwesomeIcon
      className={css(styles.devicesRowIcon)}
      fixedWidth
      icon={getIconForClient(client)}
    />
    {client.address}
    <div
      style={{ marginTop: 0, marginBottom: 0 }}
      className={css(styles.devicesRowChip)}
    >
      {client.deviceId}
    </div>
  </div>
);

ClientRow.propTypes = {
  client: PropTypes.object.isRequired,
};

const ClientList = () => {
  const context = useContext(BackendContext);
  const { clients } = context;
  let rows;
  if (clients.length) {
    rows = sortClients(clients).map((client) => ClientRow({ client }));
  } else {
    rows = [
      <div className={css(styles.devicesBlockListRow)}>
        no connected clients.
      </div>,
    ];
  }

  return (
    <div className={css(styles.devicesBlock)}>
      <div className={css(styles.devicesBlockHeader)}>connected clients</div>
      <div className={css(styles.devicesBlockList)}>{rows}</div>
    </div>
  );
};

export default ClientList;
