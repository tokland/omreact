import React from 'react';

class ImperativeCounter extends React.Component {
  state = {value: 0};

  decrement = () => {
    this.setState({value: this.state.value - 1});
  }

  increment = () => {
    this.setState({value: this.state.value + 1});
  }

  render() {
    return (
      <div>
        <button onClick={this.decrement}>-1</button>
        <button onClick={this.increment}>+1</button>
        <div>{this.state.value}</div>
      </div>
    );
  }
}

export default ImperativeCounter;
