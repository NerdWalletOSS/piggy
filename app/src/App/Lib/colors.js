import _ from 'lodash';
import Color from 'color2';
import isDark from 'color-measure/is-dark';
import isLight from 'color-measure/is-light';
import lighten from 'color-manipulate/lighten';
import darken from 'color-manipulate/darken';

let themeColors = {};
try {
  const { ipc } = window;
  const { fs } = ipc;
  const home = global.ipc.env.getPath('home');
  const fn = `${home}/.config/piggy/theme.json`;
  if (fs.existsSync(fn)) {
    /* vscode theme files allow for // comments, but JSON.parse doesn't. strip 'em */
    const comments = /^\s*\/\/.*/g;
    const contents = fs.readFileSync(fn).toString().replace(comments, '');
    themeColors = JSON.parse(contents).colors || {};
  }
} catch (ex) {
  console.error('error loading theme');
}

export const makeDarkColor = (color) => {
  let resolved = new Color(color);
  if (isDark(resolved)) {
    return color;
  }
  while (isLight(resolved)) {
    resolved = darken(resolved, 0.05);
  }
  return darken(resolved, 0.1).hexString();
};

export const makeLightColor = (color) => {
  let resolved = new Color(color);
  if (isLight(resolved)) {
    return color;
  }
  while (isDark(resolved)) {
    resolved = lighten(resolved, 0.05);
  }
  return lighten(resolved, 0.1).hexString();
};

export const backgroundify = (color) =>
  isDark(Color.from(colors.background)) // eslint-disable-line
    ? makeDarkColor(color)
    : makeLightColor(color);

export const foregroundify = (color) =>
  isDark(Color.from(colors.foreground)) // eslint-disable-line
    ? makeDarkColor(color)
    : makeLightColor(color);

export const offsetColor = (color, ratio) => {
  const resolved = new Color(color);
  return (isDark(resolved)
    ? lighten(resolved, ratio)
    : darken(resolved, ratio)
  ).hexString();
};

export const darkenBy = (color, ratio) =>
  darken(Color.from(color), ratio).hexString();

export const lightenBy = (color, ratio) =>
  lighten(Color.from(color), ratio).hexString();

export const oppositeColor = (color) => {
  const choice1 = colors.foreground; // eslint-disable-line
  const choice2 = colors.background; // eslint-disable-line
  const inputColor = new Color(color);
  const choice1Color = new Color(choice1);
  if (isDark(inputColor)) {
    return isDark(choice1Color) ? choice2 : choice1;
  }
  /* else, color is light */
  return isLight(choice1Color) ? choice2 : choice1;
};

export const overlayColor = (color, alpha) => {
  const resolved = new Color(color);
  const result = isDark(resolved)
    ? new Color([255, 255, 255])
    : new Color([0, 0, 0]);
  result.alpha(alpha);
  return result.rgbString();
};

export const makeTransparent = (color, amount) => {
  const result = new Color(color);
  result.alpha(amount);
  return result.rgbString();
};

/* raw color palette */
const colors = {
  white: themeColors['terminal.ansiWhite'] || '#a89984',
  black: themeColors['terminal.ansiBlack'] || '#3c3836',
  blue: themeColors['terminal.ansiBlue'] || '#458588',
  green: themeColors['terminal.ansiGreen'] || '#98971a',
  yellow: themeColors['terminal.ansiYellow'] || '#d79921',
  cyan: themeColors['terminal.ansiCyan'] || '#689d6a',
  magenta: themeColors['terminal.ansiMagenta'] || '#b16286',
  red: themeColors['terminal.ansiRed'] || '#cc241d',
  brightWhite: themeColors['terminal.ansiBrightWhite'] || '#ebdbb2',
  brightBlack: themeColors['terminal.ansiBrightBlack'] || '#928374',
  brightBlue: themeColors['terminal.ansiBrightBlue'] || '#83a598',
  brightGreen: themeColors['terminal.ansiBrightGreen'] || '#b8bb26',
  brightYellow: themeColors['terminal.ansiBrightYellow'] || '#fabd2f',
  brightCyan: themeColors['terminal.ansiBrightCyan'] || '#8ec07c',
  brightMagenta: themeColors['terminal.ansiBrightMagenta'] || '#d3869b',
  brightRed: themeColors['terminal.ansiBrightRed'] || '#fb4934',
};

/* basic symbolic colors */
_.extend(colors, {
  background: themeColors['editor.background'] || '#282828',
  foreground: themeColors['terminal.foreground'] || '#ebdbb2',
  toolbarBackground: themeColors['debugToolBar.background'] || '#282828',
  toolbarForeground: themeColors['terminal.foreground'] || '#ebdbb2',
  border: themeColors['editorGroup.border'] || '#3c3836',
  tabBackground: themeColors['editorGroupHeader.tabsBackground'] || '#282828',
  active: colors.brightGreen,
  title: colors.blue,
  error: colors.brightRed,
  warning: colors.brightYellow,
});

/* computed symbolic colors */
_.extend(colors, {
  activeForeground: oppositeColor(colors.active),
  titleBackground: overlayColor(colors.background, 0.05),
  gridLine: offsetColor(colors.background, 0.33),
  shadow: isDark(Color.from(colors.background))
    ? offsetColor(colors.background, -0.33)
    : offsetColor(colors.foreground, 0.5),
});

export const syntaxTheme = {
  base00: colors.background,
  base01: offsetColor(colors.background, 0.1),
  base02: offsetColor(colors.background, 0.2),
  base03: offsetColor(colors.background, 0.35),
  base04: offsetColor(colors.foreground, 0.35),
  base05: colors.foreground,
  base06: colors.foreground,
  base07: colors.foreground,
  base08: colors.red,
  base09: colors.yellow,
  base0A: colors.brightYellow,
  base0B: colors.brightGreen,
  base0C: colors.cyan,
  base0D: colors.brightCyan,
  base0E: colors.magenta,
  base0F: colors.yellow,
};

export default colors;
