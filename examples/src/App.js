import React from 'react';
import _ from 'lodash';

const requireCounters = require.context("./counter/", true, /^(.*\.js$)/);
const counters = _(requireCounters.keys())
  .map(requireCounters)
  .map(c => c.default)
  .sortBy("name")
  .value();

const onFinish = (...args) => {
  alert(`onFinish called: ${args}`);
};

class Component extends React.PureComponent {
  render() {
    const {props, component: WrappedComponent} = this.props;
    
    return (
      <div style={{border: "1px solid black", padding: 5, margin: 5}}>
        {WrappedComponent.name}
        <WrappedComponent {...props} />
      </div>
    );
  }
}

const props = {onFinish};

const App = () => (
  <div>
    {counters.map(Counter =>
      <Component key={Counter.name} visible={true} component={Counter} props={props} />
    )}
  </div>
);

if (process.env.NODE_ENV !== 'production') {
  const {whyDidYouUpdate} = require('why-did-you-update');
  whyDidYouUpdate(React);
}

export default App;
