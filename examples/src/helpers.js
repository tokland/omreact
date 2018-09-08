import React from "react";
import PropTypes from "prop-types";
import _ from "lodash";

class Button extends React.Component {
  propTypes = {
    children: PropTypes.array,
  }

  shouldComponentUpdate(nextProps, _nextState) {
    return !_.isEqual(nextProps, this.props);
  }

  render() {
    const {children, ...buttonProps} = this.props;
    return <button {...buttonProps}>{children}</button>;
  }
}

function getRandomNumber(min, max) {
  return fetch("https://qrng.anu.edu.au/API/jsonI.php?length=1&type=uint16")
    .then(res => res.json())
    .then(json => (json.data[0] % (max - min + 1)) + min);
}

export {Button, getRandomNumber};
