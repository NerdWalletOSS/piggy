import _ from 'lodash';
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { css } from 'aphrodite/no-important';
import Modal from '@widgets/Modal/Modal';
import Input from '@widgets/Input/Input';
import Button from '@widgets/Button/Button';
import deviceStyles from '@plugins/Standard/Devices/DevicesStyles';
import styles from './EditableListStyles';

export const EditableList = ({
  loadItems,
  syncItems,
  postHandleAddOk,
  postHandleRemove,
  modalTitle,
  listHeaderTitle,
  placeholderText,
}) => {
  const [items, setItems] = useState([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addItemText, setAddItemText] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(
    items.length ? items[0] : null
  );

  useEffect(() => {
    const loadedItems = loadItems();
    if (!_.isEmpty(loadedItems)) {
      setItems(loadedItems);
      syncItems(loadedItems);
    }
  }, [loadItems, syncItems]);

  const handleAdd = () => {
    setAddModalOpen(true);
    setAddItemText('');
  };

  const handleAddOk = () => {
    if (addItemText && addItemText.length) {
      if (items.indexOf(addItemText) < 0) {
        const updatedList = [...items, addItemText];
        const updatedSelectedItemId = selectedItemId || updatedList[0];
        setItems(updatedList);
        setAddModalOpen(false);
        setAddItemText('');
        setSelectedItemId(updatedSelectedItemId);
        syncItems(updatedList);
        if (postHandleAddOk) {
          postHandleAddOk(items, addItemText, selectedItemId);
        }
      }
    }
  };

  const handleRemove = () => {
    const index = items.indexOf(selectedItemId);
    if (index >= 0) {
      const updatedList = _.reject(items, (id) => id === selectedItemId);
      const updatedSelectedItemId =
        index >= updatedList.length ? updatedList[0] : updatedList[index];
      setItems(updatedList);
      setSelectedItemId(updatedSelectedItemId);
      syncItems(updatedList);
      if (postHandleRemove) {
        postHandleRemove();
      }
    }
  };

  const handleItemClick = (index) => {
    setSelectedItemId(index);
  };

  const handleCloseModal = () => {
    setAddModalOpen(false);
  };

  const handleAddItemTextChanged = (itemText) => setAddItemText(itemText);

  const renderAddModal = () => (
    <Modal title={modalTitle} open={addModalOpen} onClose={handleCloseModal}>
      <Input
        autoFocus
        value={addItemText}
        style={styles.modalInput}
        onSubmit={handleAddOk}
        onChange={handleAddItemTextChanged}
        placeholder={placeholderText}
      />
      <div className={css(styles.modalButtonContainer)}>
        <Button onClick={handleAddOk}>ok</Button>
      </div>
    </Modal>
  );

  const removeButtonClass = css([
    deviceStyles.devicesBlockFooterButton,
    !selectedItemId && deviceStyles.devicesBlockDisabledButton,
  ]);

  let rows;
  if (items.length) {
    rows = _.map(items, (index) => {
      const selected = index === selectedItemId;
      return (
        <div
          onClick={handleItemClick.bind(this, index)}
          className={css(
            deviceStyles.devicesBlockListRow,
            selected && deviceStyles.devicesBlockListRowSelected,
            deviceStyles.devicesSelectableListRow
          )}
        >
          {index}
        </div>
      );
    });
  } else {
    rows = [<div className={css(deviceStyles.devicesBlockListRow)}>none.</div>];
  }

  return (
    <div className={css(deviceStyles.devicesBlock)}>
      {addModalOpen && renderAddModal()}
      <div className={css(deviceStyles.devicesBlockHeader)}>
        {listHeaderTitle}
      </div>
      <div className={css(deviceStyles.devicesBlockList)}>{rows}</div>
      <div className={css(deviceStyles.devicesBlockFooter)}>
        <div
          className={css(deviceStyles.devicesBlockFooterButton)}
          onClick={handleAdd}
        >
          add
        </div>
        <div className={removeButtonClass} onClick={handleRemove}>
          remove
        </div>
      </div>
    </div>
  );
};

EditableList.propTypes = {
  loadItems: PropTypes.func.isRequired,
  syncItems: PropTypes.func.isRequired,
  postHandleAddOk: PropTypes.func,
  postHandleRemove: PropTypes.func,
  modalTitle: PropTypes.string,
  listHeaderTitle: PropTypes.string,
  placeholderText: PropTypes.string,
};

EditableList.defaultProps = {
  postHandleAddOk: () => {},
  postHandleRemove: () => {},
  modalTitle: '',
  listHeaderTitle: '',
  placeholderText: '',
};
