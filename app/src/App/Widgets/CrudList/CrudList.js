import _ from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePrevious } from '@lib/hooks';
import PropTypes from 'prop-types';
import Modal from '@widgets/Modal/Modal';
import Button, { BUTTON_THEME } from '@widgets/Button/Button';
import ContentEditable from 'react-contenteditable';
import { css } from 'aphrodite/no-important';
import styles from './CrudListStyles';

const DEFAULT_PLACEHOLDER = '[empty]';

const CrudRow = ({
  item,
  index,
  selected,
  setSelectedIndex,
  commitEdit,
  placeholder,
}) => {
  /* must use `useRef` and not `useState`. see:
  https://github.com/lovasoa/react-contenteditable/issues/161#issue-434981637 */
  const editedValue = useRef(`${item}`);
  const [domRef, setDomRef] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
  const prevSelected = usePrevious(selected);
  if (!prevSelected && selected && !isEditable && !editedValue.current) {
    setIsEditable(true);
  }
  useMemo(() => {
    editedValue.current = `${item}`;
  }, [item]);
  useEffect(() => {
    /* ensure we focus on mount if we're selected */
    if (selected) {
      if (domRef) {
        domRef.focus();
      }
    }
  }, [selected, domRef]);
  const commitOrRollBack = useCallback(
    (i, v) => {
      if (!v || (commitEdit && !commitEdit(i, v))) {
        editedValue.current = item;
      }
      setIsEditable(false);
    },
    [item, commitEdit, editedValue, setIsEditable]
  );
  const handleBlur = useCallback(() => {
    commitOrRollBack(index, editedValue.current);
    setIsEditable(false);
  }, [index, editedValue, commitOrRollBack, setIsEditable]);
  const handleFocus = useCallback(() => {
    setSelectedIndex(index);
  }, [setSelectedIndex, index]);
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        commitOrRollBack(index, editedValue.current);
      }
    },
    [index, editedValue, commitOrRollBack]
  );
  const handleEditableInputChange = useCallback(
    (event) => {
      editedValue.current = event.currentTarget.textContent;
    },
    [editedValue]
  );
  const handleNonEditableClick = useCallback(() => {
    if (selected) {
      setIsEditable(true);
    } else {
      setIsEditable(false);
      setSelectedIndex(index);
    }
  }, [index, selected, setSelectedIndex, setIsEditable]);
  const className = useMemo(
    () =>
      css(
        styles.crudListRow,
        !editedValue.current && !isEditable ? styles.crudListRowEmpty : null,
        selected ? styles.crudListRowSelected : null,
        isEditable ? styles.crudListRowEditing : null
      ),
    [selected, isEditable, editedValue]
  );
  if (!isEditable) {
    return (
      <div className={className} onClick={handleNonEditableClick}>
        {editedValue.current || placeholder}
      </div>
    );
  }
  return (
    <ContentEditable
      innerRef={setDomRef}
      html={editedValue.current}
      disabled={!isEditable}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onChange={handleEditableInputChange}
      placeholder={placeholder || DEFAULT_PLACEHOLDER}
      className={className}
    />
  );
};

CrudRow.propTypes = {
  item: PropTypes.any.isRequired,
  index: PropTypes.number.isRequired,
  selected: PropTypes.bool.isRequired,
  setSelectedIndex: PropTypes.func.isRequired,
  commitEdit: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

CrudRow.defaultProps = {
  placeholder: '',
};

const CrudList = ({
  title,
  data,
  defaults,
  saveData,
  placeholder,
  emptyText,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(data?.length ? 0 : -1);
  const [editedItems, setEditedItems] = useState([...data]);

  const handleCommitEdit = useCallback(
    (index, value) => {
      const updated = [...editedItems];
      updated[index] = value;
      setEditedItems(updated);
    },
    [editedItems, setEditedItems]
  );

  const rows = useMemo(
    () =>
      editedItems.map((item, index) => (
        <CrudRow
          item={item}
          index={index}
          selected={selectedIndex === index}
          setSelectedIndex={setSelectedIndex}
          commitEdit={handleCommitEdit}
          placeholder={placeholder}
        />
      )),
    [
      selectedIndex,
      setSelectedIndex,
      editedItems,
      handleCommitEdit,
      placeholder,
    ]
  );

  const empty = useMemo(
    () => (
      <div className={css(styles.emptyLabel)}>
        <div>{emptyText}</div>
      </div>
    ),
    [emptyText]
  );

  const handleSave = useCallback(() => {
    if (saveData) {
      const result = saveData(editedItems);
      if (result) {
        setEditedItems(result);
        if (selectedIndex >= result.length) {
          setSelectedIndex(result.length - 1);
        }
      }
    }
  }, [saveData, editedItems, setEditedItems, selectedIndex, setSelectedIndex]);

  const handleCancel = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const handleDefaults = useCallback(() => {
    setEditedItems([...defaults]);
  }, [defaults, setEditedItems]);

  const handleAdd = useCallback(() => {
    setEditedItems([...editedItems, '']);
    setSelectedIndex(editedItems.length);
  }, [editedItems, setEditedItems, setSelectedIndex]);

  const handleDelete = useCallback(() => {
    const withDeletedItem = [...editedItems];
    withDeletedItem.splice(selectedIndex, 1);
    setEditedItems(withDeletedItem);
    if (selectedIndex >= withDeletedItem.length) {
      setSelectedIndex(withDeletedItem.length - 1);
    }
  }, [editedItems, setEditedItems, selectedIndex, setSelectedIndex]);

  return (
    <div className={css(styles.crudList)}>
      {title && <div className={css(styles.crudListHeader)}>{title}</div>}
      <div className={css(styles.crudContentWrapper)}>
        <div className={css(styles.crudListContent)}>
          {rows.length ? rows : empty}
        </div>
        <div className={css(styles.crudListRightButtons)}>
          <Button
            style={styles.rightButtonStyleOverrides}
            theme={BUTTON_THEME.PLUGIN_CONTENT}
            onClick={handleAdd}
          >
            add
          </Button>
          <Button
            enabled={selectedIndex >= 0}
            style={styles.rightButtonStyleOverrides}
            theme={BUTTON_THEME.PLUGIN_CONTENT}
            onClick={handleDelete}
          >
            delete
          </Button>
        </div>
      </div>
      <div className={css(styles.crudListBottomButtons)}>
        {!!defaults && (
          <Button
            style={styles.bottomButtonStyleOverrides}
            theme={BUTTON_THEME.PLUGIN_CONTENT}
            onClick={handleDefaults}
          >
            defaults
          </Button>
        )}
        <div style={{ flex: 1 }} />
        <Button
          style={styles.bottomButtonStyleOverrides}
          theme={BUTTON_THEME.PLUGIN_CONTENT}
          onClick={handleCancel}
        >
          cancel
        </Button>
        <Button
          style={styles.bottomButtonStyleOverrides}
          theme={BUTTON_THEME.PLUGIN_CONTENT}
          onClick={handleSave}
        >
          save
        </Button>
      </div>
    </div>
  );
};

CrudList.propTypes = {
  title: PropTypes.string,
  data: PropTypes.arrayOf(PropTypes.any),
  defaults: PropTypes.arrayOf(PropTypes.any),
  saveData: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  emptyText: PropTypes.string,
  onClose: PropTypes.func,
};

CrudList.defaultProps = {
  data: [],
  defaults: undefined,
  title: null,
  placeholder: DEFAULT_PLACEHOLDER,
  emptyText: '',
  onClose: _.noop,
};

CrudList.Modal = ({
  title,
  onClose,
  styleOverrides,
  contentStyleOverrides,
  open,
  ...props
}) => (
  <Modal
    title={title}
    onClose={onClose}
    styleOverrides={styleOverrides}
    contentStyleOverrides={contentStyleOverrides}
    open={open}
  >
    <CrudList onClose={onClose} {...props} />
  </Modal>
);

CrudList.Modal.propTypes = {
  ...CrudList.propTypes,
  ...Modal.propTypes,
};

CrudList.Modal.defaultProps = {
  ...CrudList.defaultProps,
  ...Modal.defaultProps,
};

export default CrudList;
