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
      this.initValue = _(init).isFunction() ? init(props) : init;
      this.state = {value: this.initValue.state};
      this._getDispatcher = this._getDispatcher.bind(this);
      this._dispatch = this._dispatch.bind(this);
      this._getDispatcher = memoize(this._getDispatcher);
    }

    _shouldComponentUpdate(nextProps, nextState) {
      return shallowEqual(this.props, nextProps, this.state, nextState);
    }

    componentDidMount() {
      this._runUpdateAction(_.omit(this.initValue, ["state"]));
    }

    componentDidUpdate(prevProps) {
      if (lifecycles.newProps) {
        const propsHaveChanged = !shallowEqualWithoutReactElements(prevProps, this.props);

        if (propsHaveChanged) {
          this._dispatch(lifecycles.newProps(prevProps));
        }
      }
    }

    _dispatch(action) {
      if (!(action === null || action === undefined)) {
        const updateAction = update(action, this.state.value, this.props);
        this._runUpdateAction(updateAction);
      }
    }

    _runUpdateAction(updateAction) {
      if (!updateAction)
        return;

      const { state, asyncActions, parentActions } = updateAction;

      if (state) {
        this.setState({value: state});
      }

      if (asyncActions) {
        _(asyncActions).castArray()
          .each(asyncAction => asyncAction.then(this._dispatch));
      }

      if (parentActions) {
        _(parentActions).castArray()
          .each(parentAction => parentAction.prop(...parentAction.args));
      }
    }

    _getDispatcher(elementType, prop, value) {
      if (value === undefined) {
        throw new Error(`[${name}] you passed undefined as prop ${prop} to element ${elementType}`);
      }

      switch (prop.match(/^\$*/)[0].length) {
      case 1: // $onEvent -> pass arguments to action
        return (...args) => this._dispatch(_(value).isFunction() ? value(...args) : value);
      case 2: // $$onEvent -> don't pass arguments to action
        // This is not really needed as we can check before dispatching or the user can simply
        // ignore the event arguments. Also, we need some escaping mechanism, so $$prop -> $prop.
        return () => this._dispatch(_(value).isFunction() ? value() : value);
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
