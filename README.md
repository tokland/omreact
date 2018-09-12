## Purely functional React components with local state

`OmReact` is a thin layer over React that allows writing purely functional components that hold local state. React is mostly a functional framework, but it still promotes imperative code through `this.setState`, which works by performing side-effects.

The idea is similar to the [Elm architecture](https://guide.elm-lang.org/architecture/), but applied to components: define a **single update** function that takes **events** and returns **actions** (new state + async action + parent prop calls). On render, event props take pure values, either event constructors or plain values (example: `$onClick="increment"`), instead of functions with side effects like typical React components do.

## Install

```sh
$ yarn add omreact
```

## Example: a counter

```js
import React from 'react';
import {component, newState} from 'omreact';

const init = newState({value: 0});

const update = (event, state, props) => {
  switch (event) {
    case "decrement":
      return newState({value: state.value - 1});
    case "increment":
      return newState({value: state.value + 1});
    default:
      throw new Error(`Unknown event: ${event}`);
  }
};

const render = (state, props) => (
  <div>
    <button $onClick="decrement">-1</button>
    <button $onClick="increment">+1</button>
    <div>{state.value}</div>
  </div>
);

export default component("MyCounter", {init, render, update});
```

##  OnReact component

### Component overview

![Diagram](https://github.com/tokland/omreact/blob/master/OmReact.png)

```js
type Action = StateAction<State> | AsyncAction<Action> | ParentAction;

component: (
  name: string,
  options: {
    init: Action | Props => Action,
    update: (Event, State, Props) => Action | Array<Action>,
    render: (State, Props) => React.Element,
    lifecycles?: {newProps?: (prevProps: Props) => Event},
    propTypes?: Object,
    defaultProps?: Object,
  }) => React.Component;
```

Options:

- `init`: Set the initial state and async/parent actions. This replaces `state =` in a React class component and async and props calls in `componentDidMount`.

- `update`: Takes an event, the current `state` and `props`, and returns an action or actions to dispatch.

- `render` with `$eventProp={Event | Args => Event}`: Like a React `render` function except that event props must be prefixed with a `$`. An event can be either a plain value or a pure function. `$` is being used for convenience, it's a valid character for a variable name so there is no need to use a custom JSX babel transform. `@onClick={...}` would be probably nicer, though.

- `lifecycles`: More on the lifecyle section.

- `propTypes`/`defaultProps`. Standard React keys, will be passed down to the component.

### Actions

#### Update state (`newState`)

Return the new state of the component. This should be the new full state, not partial state like `this.setState` takes. Function: `newState: State => Action` is provided.

#### Async side-effects (`asyncAction`)

In `OmReact` components, you don't have access to `setState`, to write asynchronous code (timers, requests), you return instead an async action with a promise that resolves into some other actions. An example:

```js
import React from 'react';
import {Button} from '../helpers';
import {component, asyncAction, newState} from 'omreact';

const getRandomNumber = (min, max) => {
  return fetch("https://qrng.anu.edu.au/API/jsonI.php?length=1&type=uint16")
    .then(res => res.json())
    .then(json => (json.data[0] % (max - min + 1)) + min);
};

const events = {
  add: value => ({type: "add", value}),
  fetchRandom: {type: "fetchRandom"},
};

const init = newState({value: 0});

const update = (event, state, props) => {
  switch (event.type) {
    case "add":
      return newState({value: state.value + event.value});
    case "fetchRandom":
      return asyncAction(getRandomNumber(1, 10).then(events.add));
    default:
      throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  }
};

const render = (state, props) => (
  <div>
    <Button $onClick={events.fetchRandom}>+ASYNC_RANDOM(1..10)</Button>
    <div>{state.value}</div>
  </div>
);

export default component("CounterWithSideEffects", {init, render, update});
```

#### Call the parent component (`parentAction`)

React components report to their parents through props. While there is nothing preventing you from directly calling a prop in an `OmReact` component like you do in React, you should keep it purely functional by returning a a `parentAction`. Example:

```js
import React from 'react';
import {Button} from '../helpers';
import {component, newState, parentAction} from 'omreact';

const events = {
  increment: ev => ({type: "increment"}),
  notifyParent: ev => ({type: "notifyParent"}),
};

const init = newState({value: 0});

const update = (event, state, props) => {
  switch (event.type) {
    case "increment":
      return newState({value: state.value + 1});
    case "notifyParent":
      return parentAction(props.onFinish, state.value);
    default:
      throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  }
};

const render = (state, props) => (
  <div>
    <Button $onClick={events.increment}>+1</Button>
    <Button $onClick={events.notifyParent}>Notify parent</Button>
    <div>{state.value}</div>
  </div>
);

export default component("CounterParentNotifications", {init, render, update});
```

### Component Lifecycle

`OmReact` implements those React lifecycles:

* `newProps: (prevProps: Props) => Event`. Called any time props change.

Example:

```js
const events = {
  newProps: prevProps => ({type: "newProps", prevProps}),
}

const update = (event, state, props) => (
  switch (event.type) {
    case "newProps":
      return newState({value: event.prevProps.value});
  }
);

export default component("MyCounterWithPropsChangeDetection",
    {init, render, update, lifecycles: {newProps: events.newProps}});
```

### Events

#### Typical event signatures

A typical way of defining events is to have *constructor arguments* (optional, should be memoized), *event arguments* (should not be memoized), or both. A typical `events` object may look like this:

```js
import {memoize} from 'omreact';

const events = {
  increment: {type: "increment"},
  add: memoize(value => ({type: "add", value})),
  addMouseButton: ev => ({type: "addMouseButton", ev}),
  addValueAndMouseButton: memoize(value => ev => ({type: "add", value, ev})),
}
```

Use like this on the event props of rendered elements:

- `events.increment`: An _object_, use it when you need no arguments. Example `$onClick={events.increment}`. The dispatcher will see that it's not a function and won't call it with the event arguments.
- `events.add`: A _1-time callable function_ that takes only event constructor arguments. Example: `$onClick={events.add(1)}`. This function should be memoized.
- `events.addMouseButton`: A _1-time callable function_ that takes only event arguments: Example: `$onClick={events.addMouseButton}`. This function should not be memoized.
- `events.addValueAndMouseButton`: A _2-time callable function_ that takes both constructor and event arguments: `$onClick={events.addValueAndMouseButton(1)}`. The first function should be memoized.

#### Memoize events

One should not pass newly created values as props to components, as React will think those props changed and will issue an unnecessary re-render. This applies to arrays, objects or arrow functions - no problem with strings or numbers, `===` works fine on them.  So we should extract prop to `const` values . Also, use memoization, the library already provides a helper for that: `memoize`, in event constructors. Example:

```js
import {component, memoize} from 'omreact';

const events = {
  increment: ev => {type: "increment"},
  add: memoize(value => ({type: "add", value})), // Use: $onClick={events.add(5)}
};
```

#### Events are agnostic

An event can be any any object or function (if it has constructor/prop arguments). Create your own abstractions using strings, arrays, objects, [proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy), whatever.

Check the [examples](examples/src) to see some alternative ways:

- Using a [function constructor](https://github.com/tokland/omreact/blob/master/examples/src/counter/CounterUsingEventFunctionCreator.js).

- Using [ADT constructors](https://github.com/tokland/omreact/blob/master/examples/src/counter/CounterSimpleAdt.js).

- Using on-the-fly [proxy constructors](https://github.com/tokland/omreact/blob/master/examples/src/counter/CounterEventWithProxy.js).

#### Events are composable

```js
import {component, newState, composeEvents, memoize} from 'omreact';

// ...

const update = (event, state, props) => event.match({
  add: value =>
    newState({value: state.value + value}),
  addOnePlusTwo: () =>
    composeEvents([events.add(1), events.add(2)], update, state, props),
});

// ...
```

## Examples

Check the [examples](examples/src) directory in the repository.

```sh
$ cd examples
$ yarn install
$ yarn start
```
