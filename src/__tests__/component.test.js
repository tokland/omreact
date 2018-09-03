import React from 'react';
import {shallow} from 'enzyme';
import {component} from '..'

describe("component", () => {
  it('renders', () => {
    const wrapper = shallow(<div>Hello</div>);
    expect(wrapper.find('div').text()).toEqual('Hello');
  });
});
