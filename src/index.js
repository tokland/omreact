import memoize from 'memoize-weak';

import {component} from './component';
import {command, newState, composeActions, actionMatch, action} from './actions';
import {sideEffect, eventPreventDefault, callProp} from './commands';

export {
  component,
  command,
  newState,
  composeActions,
  actionMatch,
  action,
  sideEffect,
  eventPreventDefault,
  callProp,
  memoize,
};
