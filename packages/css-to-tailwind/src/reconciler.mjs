import { unstable_act as act } from 'react';
import { EventEmitter } from 'node:events';
import ReactReconciler from 'react-reconciler';
import {
  DefaultEventPriority,
  ConcurrentRoot,
} from 'react-reconciler/constants.js';

class Queue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
  }

  push(task) {
    this.queue.push(task);
    this.emit('task');
  }

  start() {
    this.on('task', () => {
      if (this.queue.length > 0) {
        const task = this.queue.shift();
        act(() => {
          task();
        });
      }
    });
  }

  isEmpty() {
    return this.queue.length === 0;
  }
}

class PromptNode {}

// const promptHolder = makePrompt({ property, value });
// const { completion } = await sendPrompt(promptHolder);
// const [error, declarations] = parseCompletion(completion, promptHolder);

const REACT_INTERNAL_PROPS = ['ref', 'key', 'children'];
function getInstanceProps(props) {
  const instanceProps = {};

  for (const key in props) {
    if (!REACT_INTERNAL_PROPS.includes(key)) instanceProps[key] = props[key];
  }

  return instanceProps;
}

const reconciler = ReactReconciler({
  // createInstance(type, props) {
  //   const el = document.createElement(type);
  //   ['className', 'src', 'alt', 'href', 'target', 'rel'].forEach((attr) => {
  //     if (props[attr]) {
  //       el[attr] = props[attr];
  //     }
  //   });

  //   if (props.onClick) {
  //     el.addEventListener('click', props.onClick);
  //   }

  //   if (props.bgColor) {
  //     el.style.backgroundColor = props.bgColor;
  //   }

  //   return el;
  // },
  // createTextInstance(text, rootContainerInstance) {
  //   return document.createTextNode(text);
  // },
  // removeChild(container, child) {
  //   container.removeChild(child);
  // },
  // appendChild(container, child) {
  //   container.appendChild(child);
  // },
  // appendInitialChild(container, child) {
  //   container.appendChild(child);
  // },
  // appendChildToContainer: (container, child) => {
  //   container.appendChild(child);
  // },
  // insertBefore(parent, child, before) {
  //   parent.insertBefore(child, before);
  // },
  // insertInContainerBefore(container, child, beforeChild) {
  //   container.insertBefore(child, beforeChild);
  // },
  // prepareUpdate(instance, _type, oldProps, newProps) {
  //   const payload = {};

  //   ['className', 'src', 'alt', 'href', 'target', 'rel'].forEach((attr) => {
  //     if (oldProps[attr] !== newProps[attr]) {
  //       payload[attr] = newProps[attr];
  //     }
  //   });

  //   if (oldProps.onClick !== newProps.onClick) {
  //     payload.onClick = newProps.onClick;
  //   }

  //   if (oldProps.bgColor !== newProps.bgColor) {
  //     payload.newBgColor = newProps.bgColor;
  //   }

  //   return payload;
  // },
  // commitUpdate(instance, updatePayload, type, oldProps, newProps, fiber) {
  //   ['className', 'src', 'alt', 'href', 'target', 'rel'].forEach((attr) => {
  //     if (updatePayload[attr]) {
  //       instance[attr] = updatePayload[attr];
  //     }
  //   });

  //   if (updatePayload.onClick) {
  //     instance.removeEventListener('click', oldProps.onClick);
  //     instance.addEventListener('click', updatePayload.onClick);
  //   }

  //   if (updatePayload.newBgColor) {
  //     instance.style.backgroundColor = updatePayload.newBgColor;
  //   }
  // },

  isPrimaryRenderer: false,
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,
  now: Date.now,
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,
  createInstance: (type, props) => ({
    type,
    props: getInstanceProps(props),
    children: [],
  }),
  hideInstance() {},
  unhideInstance() {},
  createTextInstance: (value) => ({
    type: 'text',
    props: { value },
    children: [],
  }),
  hideTextInstance() {},
  unhideTextInstance() {},
  appendInitialChild: (parent, child) => parent.children.push(child),
  appendChild: (parent, child) => parent.children.push(child),
  appendChildToContainer: (container, child) => (container.head = child),
  insertBefore: (parent, child, beforeChild) =>
    parent.children.splice(parent.children.indexOf(beforeChild), 0, child),
  removeChild: (parent, child) =>
    parent.children.splice(parent.children.indexOf(child), 1),
  removeChildFromContainer: (container) => (container.head = null),
  getPublicInstance: () => null,
  getRootHostContext: () => null,
  getChildHostContext: () => null,
  shouldSetTextContent: () => false,
  finalizeInitialChildren: () => false,
  prepareUpdate: () => ({}),
  commitUpdate: (instance, _, __, ___, props) =>
    (instance.props = getInstanceProps(props)),
  commitTextUpdate: (instance, _, value) => (instance.props.value = value),
  prepareForCommit: () => null,
  resetAfterCommit() {},
  preparePortalMount() {},
  clearContainer: (container) => (container.head = null),
  getCurrentEventPriority: () => DefaultEventPriority,
  beforeActiveInstanceBlur: () => {},
  afterActiveInstanceBlur: () => {},
  detachDeletedInstance: () => {},
});

const ReactPrompt = {
  config: (options) => ({
    async run(element) {
      const container = { head: null, queue: new Queue() };
      const root = reconciler.createContainer(
        container,
        ConcurrentRoot,
        null,
        false,
        null,
        '',
        console.error,
        null,
      );

      act(() => reconciler.updateContainer(element, root, null, undefined));

      return container;
    },
  }),
};

export default ReactPrompt;
