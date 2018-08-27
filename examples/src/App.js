import React from 'react';
import ImperativeCounter from './counter/ImperativeCounter';
import CounterIncrement from './counter/CounterIncrement';
import CounterIncrementFun from './counter/CounterIncrementFun';
import CounterIncrementStringAction from './counter/CounterIncrementStringAction';
import CounterSimple from './counter/CounterSimple';
import CounterSimpleAdt from './counter/CounterSimpleAdt';
import CounterAddRandom from './counter/CounterAddRandom';
import CounterComplex from './counter/CounterComplex';
import CounterActionsSimple from './counter/CounterActionsSimple';
import CounterActionsWithProxy from './counter/CounterActionsWithProxy';

const onFinish = (...args) => {
  console.log("onFinish called", ...args);
};

class Component extends React.PureComponent {
  state = {isVisible: true};

  mount = () => {
    this.setState({isVisible: true});
  }

  unmount = () => {
    this.setState({isVisible: false});
  }

  render() {
    const {isVisible} = this.state;
    const {visible, props, component: WrappedComponent} = this.props;
    if (!visible)
      return null;
    
    return (
      <div style={{border: "1px solid black", padding: 5, margin: 5}}>
        <div>
          {WrappedComponent.name}
          {/*
          <button onClick={isVisible ? this.unmount : this.mount}>
            {isVisible ? "UnMount" : "Mount"}
          </button>
          */}
        </div>

        <div>
          {isVisible && <WrappedComponent {...props} />}
        </div>
      </div>
    );
  }
}

const props = {onFinish};

const App = () => (
  <div>
    <Component visible={false} component={ImperativeCounter} props={props} />
    <Component visible={true} component={CounterIncrementFun} props={props} />
    <Component visible={true} component={CounterIncrementStringAction} props={props} />
    <Component visible={true} component={CounterIncrement} props={props} />
    <Component visible={true} component={CounterSimple} props={props} />
    <Component visible={true} component={CounterAddRandom} props={props} />
    <Component visible={true} component={CounterActionsSimple} props={props} />
    <Component visible={true} component={CounterSimpleAdt} props={props} />
    <Component visible={true} component={CounterActionsWithProxy} propx={props} />
    <Component visible={true} component={CounterComplex} props={props} />
  </div>
);

if (process.env.NODE_ENV !== 'production') {
  const {whyDidYouUpdate} = require('why-did-you-update');
  whyDidYouUpdate(React);
}

export default App;
