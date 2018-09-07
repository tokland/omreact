import memoize from "memoize-weak";

export {memoize};
export {component} from "./component";
export {
  command,
  sideEffect,
  eventPreventDefault,
  callProp,
  newState,
  composeActions,
  actionMatch,
  action,
} from "./commands";
