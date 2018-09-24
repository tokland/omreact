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

    _shouldComponentUpdate(nextProps, nextState) {
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
        throw new Error(`[${name}] you passed undefined as prop ${prop} to element ${elementType}`);
      }

      switch (prop.match(/^\$*/)[0].length) {
      case 1: // $onEvent -> pass arguments to event
        return (...args) => this._dispatchAction(_(value).isFunction() ? value(...args) : value);
      case 2: // $$onEvent -> don't pass arguments to event
        // This is not really needed as we can check before dispatching or the user can simply
        // ignore the event arguments. Also, we need some escaping mechanism: $$prop -> $prop.
        return () => this._dispatchAction(_(value).isFunction() ? value() : value);
      default:
        throw new Error("Invalid event prop: " + prop);
      }
    }

    render() {
      const elementWithVirtualEvents = render(this.state.value, this.props);
      return processEventProps(elementWithVirtualEvents, this._getDispatcher);
    }
  };
}

function processEventProps(element, getDispatcher) {
  if (!element || !element.props) {
    return element;
  } else {
    const convertProp = (value, prop) => {
      return prop.startsWith("$")
        ? [prop.replace(/^\$*/, ""), getDispatcher(element.type.name || element.type, prop, value)]
        : [prop, value];
    };
    const allProps = _(element.props).map(convertProp).fromPairs().value();
    const { children } = element.props;
    const newChildren = React.Children.map(children, el => processEventProps(el, getDispatcher));
    return React.createElement(element.type, allProps, newChildren);
  }
}

export {component};
