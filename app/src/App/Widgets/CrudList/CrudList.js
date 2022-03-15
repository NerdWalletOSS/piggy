import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
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
  const editedValue = useRef('');
  const [domRef, setDomRef] = useState(null);
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
    },
    [item, commitEdit, editedValue]
  );
  const onBlur = useCallback(() => {
    commitOrRollBack(index, editedValue.current);
  }, [index, editedValue, commitOrRollBack]);
  const onFocus = useCallback(() => setSelectedIndex(index), [
    setSelectedIndex,
    index,
  ]);
  const onKeyUp = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        commitOrRollBack(index, editedValue.current);
      }
    },
    [index, editedValue, commitOrRollBack]
  );
  const onChange = useCallback(
    (event) => {
      editedValue.current = event.currentTarget.textContent;
    },
    [editedValue]
  );
  return (
    <ContentEditable
      innerRef={setDomRef}
      html={editedValue.current}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyUp={onKeyUp}
      onChange={onChange}
      placeholder={placeholder || DEFAULT_PLACEHOLDER}
      className={css(
        styles.crudListRow,
        selected ? styles.crudListRowSelected : null
      )}
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

const CrudList = ({ title, data, saveData, placeholder }) => {
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
      <div className={css(styles.crudListHeader)}>{title}</div>
      <div className={css(styles.crudContentWrapper)}>
        <div className={css(styles.crudListContent)}>{rows}</div>
        <div className={css(styles.crudListFooter)}>
          <Button
            style={styles.buttonStyleOverrides}
            theme={BUTTON_THEME.PLUGIN_CONTENT}
            onClick={handleAdd}
          >
            add
          </Button>
          <Button
            enabled={selectedIndex >= 0}
            style={styles.buttonStyleOverrides}
            theme={BUTTON_THEME.PLUGIN_CONTENT}
            onClick={handleDelete}
          >
            delete
          </Button>
          <Button
            style={styles.buttonStyleOverrides}
            theme={BUTTON_THEME.PLUGIN_CONTENT}
            onClick={handleSave}
          >
            save
          </Button>
        </div>
      </div>
    </div>
  );
};

CrudList.propTypes = {
  title: PropTypes.string,
  data: PropTypes.arrayOf(PropTypes.any).isRequired,
  saveData: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

CrudList.defaultProps = {
  title: null,
  placeholder: DEFAULT_PLACEHOLDER,
};

export default CrudList;
