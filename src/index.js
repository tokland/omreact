import memoize from "memoize-weak";

export {memoize};

export {component} from "./omreact/component";

export {
  newState,
  asyncAction,
  parentAction,
  sideEffect,
  composeEvents,
  eventPreventDefault,
} from "./omreact/actions";
