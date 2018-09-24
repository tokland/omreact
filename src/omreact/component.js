import React from "react";
import memoize from "memoize-weak";
import _ from "lodash";
import {shallowEqual, shallowEqualWithoutReactElements} from "shouldcomponentupdate-children";

function component(name, {
  init,
  render,
  update,
  lifecycles = {},
  propTypes = {},
  defaultProps = {},
}) {
  return class OmReactComponent extends React.Component {
    static name = name || "OmReactComponent";
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor(props) {
      super(props);

      const initActionOrActions = _(init).isFunction() ? init(props) : init;
      const [initStateActions, initNonStateActions] =
        _(initActionOrActions).castArray().partition(action => action.type === "newState").value();

      this.initMountActions = initNonStateActions;
      this.state = {value: initStateActions[0].state};
      this._dispatchAction = this._dispatchAction.bind(this);
      this._getDispatcher = memoize(this._getDispatcher.bind(this));
    }

    shouldComponentUpdate(nextProps, nextState) {
      return shallowEqual(this.props, nextProps, this.state, nextState);
    }

    componentDidMount() {
      this._runActions(this.initMountActions);
    }

    componentDidUpdate(prevProps) {
      if (lifecycles.newProps) {
        const propsHaveChanged = !shallowEqualWithoutReactElements(prevProps, this.props);

        if (propsHaveChanged) {
          this._dispatchAction(lifecycles.newProps(prevProps));
        }
      }
    }

    _dispatchAction(event) {
      if (!(event === null || event === undefined)) {
        const actionOrActions = update(event, this.state.value, this.props);
        this._runActions(_.castArray(actionOrActions));
      }
    }

    _runActions(actions) {
      _(actions).each(action => {
        switch(action.type) {
        case "newState":
          this.setState({value: action.state});
          break;
        case "asyncAction":
          action.promise.then(this._dispatchAction);
          break;
        case "parentAction":
          action.prop(...action.args);
          break;
        }
      });
    }

    _getDispatcher(elementType, prop, value) {
      if (value === undefined) {
        throw new Error(`[${name}] you passed prop ${prop}={undefined} to element ${elementType}`);
      } else {
        return (...args) => this._dispatchAction(_(value).isFunction() ? value(...args) : value);
      }
    }

    render() {
      const elementWithVirtualEvents = render(this.state.value, this.props);
      return processEventProps(elementWithVirtualEvents, this._getDispatcher);
    }
  };
}

/* Process React element recursively and transform all $xyz={action} props to xyz={dispatch(action)} */

const eventPropRegexp = /^\$[^$]/;

function processEventProps(element, getDispatcher) {
  if (!element || !element.props) {
    return element;
  } else {
    const convertProp = (value, prop) => {
      const isEventProp = prop.match(eventPropRegexp);
      if (isEventProp) {
        const dispatcher = getDispatcher(element.type.name || element.type, prop, value);
        return [prop.replace(/^\$*/, ""), dispatcher];
      } else {
        return [prop, value];
      }
    };
    const { children } = element.props;
    const newChildren = React.Children.map(children, el => processEventProps(el, getDispatcher));
    const finalProps = _(element.props).map(convertProp).fromPairs().value();
    return React.createElement(element.type, finalProps, newChildren);
  }
}

export {component};
