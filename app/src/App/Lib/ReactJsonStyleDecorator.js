import colors from './colors';

const ICON_FONTS = new Set([
  'copy-icon',
  'copy-icon-copied',
  'removeVarIcon',
  'addVarIcon',
  'editVarIcon',
  'check-icon',
  'cancel-icon',
  'key-modal-cancel-icon',
  'key-modal-submit',
  'validation-failure-clear',
]);

const styleDecorator = (config, name) => {
  if (ICON_FONTS.has(name)) {
    config.style.fontSize = '11px';
    if (name === 'copy-icon') {
      config.style.color = colors.blue;
      config.style.padding = '1px 2px 0px 0px';
    } else if (name === 'copy-icon-copied') {
      config.style.color = colors.green;
      config.style.paddingRight = '3px';
    }
  }
  return config;
};

export default styleDecorator;
