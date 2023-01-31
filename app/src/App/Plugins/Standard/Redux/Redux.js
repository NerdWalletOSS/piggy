import _ from 'lodash';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { css } from 'aphrodite/no-important';
import { GlobalHotKeys } from 'react-hotkeys';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { flatten } from 'flat';
import serverProxy from '@app/ServerProxy';
import Button from '@widgets/Button/Button';
import Modal from '@widgets/Modal/Modal';
import Input from '@widgets/Input/Input';
import PluginLayout from '@widgets/Plugin/PluginLayout';
import { Toolbar, ToolbarIcon } from '@widgets/Toolbar';
import { indexChildren } from '@lib/search';
import styles from './ReduxStyles';
import { ReduxStateSliceItem } from './ReduxStateSliceItem';

const SET_STATE_SUBSCRIPTIONS_PATHS_MESSAGE = '/stateSubscriptions/setPaths';
const UPDATE_MESSAGE = '/stateSubscriptions/update';

const KEY_MAP = {
  NEW_SUBSCRIPTION: 'command+n',
};

export default class StateSubscriptions extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      modalOpen: false,
      newSubscriptionPath: '',
      subscriptions: {},
    };
    this.keyHandlers = {
      NEW_SUBSCRIPTION: this.toggleModal,
    };
    this.handleUpdateMessage = this.handleUpdateMessage.bind(this);
  }

  // Called when a subscription updates
  handleUpdateMessage = (event, message) => {
    const { subscriptions } = this.state;
    const updatedSubscriptions = message.data;
    const mergedStateSubscriptions = { ...subscriptions };
    Object.keys(updatedSubscriptions).forEach((key) => {
      const pathValue = updatedSubscriptions[key];
      const pathFragments = key.split('.');
      const isPathValueAnObject = _.isPlainObject(pathValue);
      const dataToIndex = isPathValueAnObject
        ? pathValue
        : { [pathFragments[pathFragments.length - 1]]: pathValue };
      indexChildren(
        `stateSubscription_${key}`,
        [flatten(dataToIndex)],
        null,
        true
      );
      mergedStateSubscriptions[key] = {
        ...mergedStateSubscriptions[key],
        ...updatedSubscriptions[key],
      };
    });
    this.setState({
      subscriptions: mergedStateSubscriptions,
    });
  };

  componentDidMount() {
    serverProxy.onWs(UPDATE_MESSAGE, this.handleUpdateMessage);
  }

  componentWillUnmount() {
    serverProxy.offWs(UPDATE_MESSAGE, this.handleUpdateMessage);
  }

  toggleModal = () =>
    this.setState((state) => ({
      modalOpen: !state.modalOpen,
    }));

  clearNewSubscription = () => this.setState({ newSubscriptionPath: '' });

  handleCloseModal = () => {
    this.toggleModal();
    this.clearNewSubscription();
  };

  handleAddSubscription = () => {
    const { subscriptions, newSubscriptionPath } = this.state;

    global.ipc.events.emit('/ws/send', {
      name: SET_STATE_SUBSCRIPTIONS_PATHS_MESSAGE,
      data: {
        paths: [...Object.keys(subscriptions), newSubscriptionPath],
      },
    });

    this.toggleModal();
    this.clearNewSubscription();
  };

  handleRemoveSubscription = (subscriptionKey) => {
    const { subscriptions } = this.state;
    const remainingSubscriptions = _.omit(subscriptions, [subscriptionKey]);
    this.setState({ subscriptions: remainingSubscriptions }, () => {
      global.ipc.events.emit('/ws/send', {
        name: SET_STATE_SUBSCRIPTIONS_PATHS_MESSAGE,
        data: {
          paths: Object.keys(remainingSubscriptions),
        },
      });
    });
  };

  handleNewSubscriptionPathChange = (path) =>
    this.setState((state) => ({ newSubscriptionPath: path }));

  renderNewSubscriptionModal() {
    const { modalOpen, newSubscriptionPath } = this.state;
    return (
      <Modal
        title="add subscription"
        open={modalOpen}
        onClose={this.handleCloseModal}
      >
        <Input
          autoFocus
          style={styles.subscriptionInput}
          value={newSubscriptionPath}
          onSubmit={this.handleAddSubscription}
          onChange={this.handleNewSubscriptionPathChange}
          placeholder="path, or * for all"
        />
        <div className={css(styles.addSubscriptionModalButtons)}>
          <Button onClick={this.handleAddSubscription}>ok</Button>
        </div>
      </Modal>
    );
  }

  renderToolbar() {
    return (
      <Toolbar>
        <ToolbarIcon
          isOn
          tooltip={<span>add state subscription</span>}
          fontAwesomeIcon={faPlus}
          onClick={this.toggleModal}
        />
      </Toolbar>
    );
  }

  renderEmpty() {
    return (
      <div className={css(styles.emptyWrapper)}>
        <div>
          press the plus button in the toolbar up top and add a redux path to
          watch.
        </div>
      </div>
    );
  }

  render() {
    const { visible } = this.props;

    if (!visible) {
      return null;
    }

    const { subscriptions } = this.state;
    const stateSubscriptionViews = Object.keys(subscriptions).map(
      (stateSubscriptionKey) => (
        <ReduxStateSliceItem
          subscriptions={subscriptions}
          subscriptionKey={stateSubscriptionKey}
          handleRemoveSubscription={this.handleRemoveSubscription}
        />
      )
    );

    return (
      <GlobalHotKeys keyMap={KEY_MAP} handlers={this.keyHandlers}>
        <PluginLayout
          title="redux state subscriptions"
          toolbarComponents={[this.renderToolbar()]}
        >
          <div className={css(styles.container)}>
            {_.size(stateSubscriptionViews) === 0
              ? this.renderEmpty()
              : stateSubscriptionViews}
            {this.renderNewSubscriptionModal()}
          </div>
        </PluginLayout>
      </GlobalHotKeys>
    );
  }
}

StateSubscriptions.propTypes = {
  visible: PropTypes.bool.isRequired,
};
