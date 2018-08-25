# OmReact

Purely functional React components with local state.

React.js is mainly a functional framework: render full views from state and don't bother with in-place updates of the DOM. However, it still promotes imperative state updates through `this.setState`. `OmReact` is a thin abstraction layer over React.js that allows to write purely functional components that hold local state.

Think of `OmReact` as an component-with-local-state based Elm approach.

## Install

```sh
$ npm install omreact
```

## Simple example: counter

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
      throw new Error(`[update] Action to implemented: ${JSON.stringify(action)}`);
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

## Component overview

As you see, an omreact component is defined by:

- `init`: The initialization command. It's equivalent to using `this.state = ...` and ` componentDidMount` + `this.setState` in a typical React application.

- `update`: Takes an action and the current `state`/`props` and should return a command to run. A command has those keys:

  - `state`: The new state to set.
  - `asyncActions`: An array of promises that resolve into another actions.
  - `parentActions`: An array of parent actions to notify the parent component through props.

- `render`: Typical React render function except that it accepts `$eventProp` to pass actions (either pure values or pure functions) instead of impure functions with side-effects. `$eventProp` would pass the arguments to the value, `$$eventProp` does not, so the value should be a plain object action, not a function.

## Side-effects

`omreact` does not provides `setState`, you write asynchronous (timers, requests) code returning a command with `asyncActions`, an array of promises that resolve into some other actions. An example:

```js
import React from 'react';
import {Button} from '../helpers';
import {component, command} from 'omreact';

const getPromiseRandomNumber = (min, max) => {
  return fetch("https://qrng.anu.edu.au/API/jsonI.php?length=1&type=uint16")
    .then(res => res.json())
    .then(json => (json.data[0] % (max - min + 1)) + min);
};

const actions = {
  add: value => ({type: "add", value}),
  fetchRandom: () => ({type: "fetchRandom"}),
};

const init = command({state: {value: 0}});

const update = (action, state, props) => {
  switch (action.type) {
    case "add":
      return command({state: {value: state.value + action.value}});
    case "fetchRandom":
      return command({asyncActions: [getPromiseRandomNumber(1, 10).then(actions.add)]});
    default:
      throw new Error(`[update] Action to implemented: ${JSON.stringify(action)}`);
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

React.js components report to the their parents using props. This is JS, there is nothing preventing you from directly calling props (i.e `props.onClick(someData)` in the update function, but this module provides a functional way: return `parentActions` in a command, passing an array of `callProp` entries. Example:

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
      throw new Error(`[update] Action to implemented: ${JSON.stringify(action)}`);
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

### Actions

### Props/actions memoization

It's a well known caveat in React that you should never pass newly created arrays, objects or functions as props. React components would think those props have changed and issue an unnecessary re-render. Extract them always to `const` values. Also, use memoization (helper `memoize`) in action constructors. Example:

```js
import {component, memoize} from 'omreact';

const actions = {
  increment: {type: "increment"},
  add: memoize(value => ({type: "increment"})),
};
```

#### Object actions vs function actions

If you have an action that needs arguments from the event, use a single `$` prefix and pass a function action:

```js
const actions = {
  increment: ev => ({type: "increment", ev}),
};

// <a $onClick={actions.increment}`>+1</a>
```

When you have an action that don't need arguments from the event, use a double `$$` prefix and pass an non-function action:

```js
const actions = {
  increment: {type: "increment"},
};

// <a $onClick={actions.increment}`>+1</a>
```

#### Agnostic actions

When looking on the examples, you could wonder there is a bit of boilerplate on the actions. Instead of a single function that makes this`.setState` calls, we have now actions and a dispatcher that need to match those actions.

However, note that those `actions` objects are just examples, you could be using any action constructors you want. Create individual function, use strings, arrays, objects, be real fancy with proxy objects, whatever works for you. Check the [examples](examples/src) to see some alternatives to build actions (action creators from string, ADT with [daggy](https://github.com/fantasyland/daggy)).

#### How do actions usually look?

They tend to have these 4 forms:

- An _object_: They don't need arguments. Example `$$onClick={actions.increment}`.
- A _1-time callable function_ that takes only constructor arguments. Example: `$$onClick={actions.add(1)}`.
- A _1-time callable function_ that takes only event arguments: Example: `$onClick={actions.addMouseButton}`.
- A _2-time callable function_ that takes both constructor and event arguments: `$onClick={actions.addValueAndMouseButton(1)}`.

### Other examples

Check the [examples](examples/src) directory in the repository.