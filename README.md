# OmReact

Purely functional React components with local state.

React is mostly functional, just render the whole view for a component from its state, and don't bother with in-place updates of the DOM. However, it still promotes imperative code because of how `this.setState` works. `OmReact` is a thin abstraction layer over React.js that allows you to write purely functional components that hold local state.

`OmReact` applies the [Elm architecture](https://guide.elm-lang.org/architecture/) to React components with local state.

## Install

```sh
$ yarn add omreact
```

## Examples

### A simple example: a counter

```js
import React from 'react';
import {component, command} from 'omreact';

const actions = {
  decrement: ev => ({type: "decrement"}),
  increment: ev => ({type: "increment"}),
};

const init = command({state: {value: 0}});

const update = (action, state, props) => {
  switch (action.type) {
    case "decrement":
      return command({state: {value: state.value - 1}});
    case "increment":
      return command({state: {value: state.value + 1}});
    default:
      throw new Error(`Unknown action: ${JSON.stringify(action)}`);
  }
};

const render = (state, props) => (
  <div>
    <button $onClick={actions.decrement}>-1</button>
    <button $onClick={actions.increment}>+1</button>
    <div>{state.value}</div>
  </div>
);

export default component("CounterSimple", {init, render, update});
```

### Examples page

```sh
$ cd examples
$ yarn install
$ yarn start
```

Go to `http://localhost:3000`.

## Development

### Component overview

![Diagram](https://github.com/tokland/omreact/blob/master/OmReact.png)

> component(name, {init, update, render, [lifecycles]})

Options:

- `init: command | state => command` command: Equivalent to using `this.state = ...` and ` componentDidMount` + `this.setState` in a typical React component.

- `update(action, state, props): command`: Takes an action and current `state`/`props` and return a command to perform.

- `render(state, props: React.element` with `$eventProp={action | args => action}`: Like a React `render` function except that you should prefix event props with a `$` and pass the action to be executed. An action can be either a plain value or a pure function. Why `$`? It's a valid JS character for variable names, this way we don't need to use a custom JSX babel transform (although `@onClick={...}` would be probably nicer).

#### Command

A command may have any of those three keys:

  - `state`: The new state of the component.
  - `asyncActions`: An array of promises that resolve into actions.
  - `parentActions`: An array of parent actions to notify the parent component through props.

### Side-effects

`OmrRact` does not provide access to the `setState` method of the component. Instead, you write asynchronous code (timers, requests) using `asyncActions` of a command, an array of promises that resolve into some other actions. An example:

```js
import React from 'react';
import {Button} from '../helpers';
import {component, command} from 'omreact';

const getRandomNumber = (min, max) => {
  return fetch("https://qrng.anu.edu.au/API/jsonI.php?length=1&type=uint16")
    .then(res => res.json())
    .then(json => (json.data[0] % (max - min + 1)) + min);
};

const actions = {
  add: value => ({type: "add", value}),
  fetchRandom: {type: "fetchRandom"},
};

const init = command({state: {value: 0}});

const update = (action, state, props) => {
  switch (action.type) {
    case "add":
      return command({state: {value: state.value + action.value}});
    case "fetchRandom":
      return command({asyncActions: [getRandomNumber(1, 10).then(actions.add)]});
    default:
      throw new Error(`Unknown action: ${JSON.stringify(action)}`);
  }
};

const render = (state, props) => (
  <div>
    <Button $onClick={actions.fetchRandom}>+ASYNC_RANDOM(1..10)</Button>
    <div>{state.value}</div>
  </div>
);

export default component("CounterSideEffects", {init, render, update});
```

### Parent actions

React components report to the their parents using props. This is JS, there is nothing preventing you from directly calling props (i.e `props.onClick(someData)` in the update function, but `OmReact`module provides a functional way to do it: use the `parentActions` key in a command, passing an array of `callProp` entries. Example:

```js
import React from 'react';
import {Button} from '../helpers';
import {component, command} from 'omreact';
import {callProp} from 'omreact/commands';

const actions = {
  increment: ev => ({type: "increment"}),
  notifyParent: ev => ({type: "notifyParent"}),
};

const init = command({state: {value: 0}});

const update = (action, state, props) => {
  switch (action.type) {
    case "increment":
      return command({state: {value: state.value + 1}});
    case "notifyParent":
      return command({parentActions: [callProp(props.onFinish, state.value)]});
    default:
      throw new Error(`Unknown action: ${JSON.stringify(action)}`);
  }
};

const render = (state, props) => (
  <div>
    <Button $onClick={actions.increment}>+1</Button>
    <Button $onClick={actions.notifyParent}>Notify parent</Button>
    <div>{state.value}</div>
  </div>
);

export default component("CounterParentNotifications", {init, render, update});
```

### Some notes on actions

#### Memoization

It's a well known caveat in React that you should never pass newly created values (arrays, objects or arrow functions) as props, as the React component will think those props changed and will issue an unnecessary re-render. Always extract them to `const` values. Also, use memoization (the library already provides a helper for that: `memoize`) in action constructors. Example:

```js
import {component, memoize} from 'omreact';

const actions = {
  increment: ev => {type: "increment"},
  add: memoize(value => ({type: "increment"})),
};
```

#### Agnostic actions

When looking on the examples, you may think there is a little bit of boilerplate on the actions constructors. No problem, you can use any actions infrastructure you want. Create individual function, use strings, arrays, objects, get fancy with [proxy objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy), whatever works for you.

Check the [examples](examples/src) to see some alternative ways of creating actions:

- Using helper `omreact.action` to build actions from strings and arguments. [Link](https://github.com/tokland/omreact/blob/master/examples/src/counter/CounterActionsSimple.js).

- Using ADT constructors. [Link](https://github.com/tokland/omreact/blob/master/examples/src/counter/CounterSimpleAdt.js)

#### How do actions usually look?

They use to have these 4 shapes.:

```js
const actions = {
  increment: {type: "increment"},
  add: value => ({type: "add", value}),
  addMouseButton: ev => ({type: "addMouseButton", ev}),
  addValueAndMouseButton: value => ev => ({type: "add", value, addValueAndMouseButton}),
}
```

And they are called this way:

- An _object_: Use it when you need no arguments. Example `$onClick={actions.increment}`. The dispatcher will see that it's not a function and won't try to call it with the event arguments.
- A _1-time callable function_ that takes only constructor arguments. Example: `$onClick={actions.add(1)}`. This actions should be memoized, as we discussed before.
- A _1-time callable function_ that takes only event arguments: Example: `$onClick={actions.addMouseButton}`. This action should not be memoized.
- A _2-time callable function_ that takes both constructor and event arguments: `$onClick={actions.addValueAndMouseButton(1)}`. The first call should be memoized.

### Other examples

Check the [examples](examples/src) directory in the repository.
