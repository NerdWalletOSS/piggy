import React, { PureComponent } from 'react';
import { EditableList } from '@widgets/EditableList/EditableList';
import settings from '@app/Settings';

const globalSettings = settings.get('global');

export default class Blocklist extends PureComponent {
  loadBlocklist = () => globalSettings.get('devices.blocklist', []);

  syncBlocklist = (blocklist) => {
    global.ipc.events.emit('/client/setDeviceIdBlocklist', blocklist);
    globalSettings.set('devices.blocklist', blocklist);
  };

  render() {
    return (
      <EditableList
        loadItems={this.loadBlocklist}
        syncItems={this.syncBlocklist}
        modalTitle="add device id to blocklist"
        listHeaderTitle="device blocklist"
        placeholderText="device id"
      />
    );
  }
}
