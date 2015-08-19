# malt

A simple example of Mithril using Alt implementation of the Flux architecture in ES6.

It uses the very simple example in [Getting Started](http://lhorie.github.io/mithril/getting-started.html#summary)
converted to ES6.   There are actually two versions of it, with and without Alt, a popular implementation of the Flux architecture, the later with several features shown.

## Installation

* Download the  [ZIP file](https://github.com/Satyam/malt/archive/master.zip) and extract it anywhere you want.
* Move into wherever it got installed.
* run `npm install`

## Running

A minimal web server is provided.  By default it will use port 8000.  If that is fine, you may simply do:

* run `npm start`

Otherwise edit the `package.json` file and look for the line that says:

`"start": "node_modules/local-web-server/bin/ws.js -p 8000"`

Change the port number from `8000` to whatever you want, then do `npm start` as before.

In a browser, go to:

`localhost:8000/m.html`

... or whatever port you changed the server to.

----

There are several test files, as described in the sections below. From the browser point of view they behave very much the same. Each `.html` file loads the `.js` with the matching name. It is interesting to compare the `.js` files in between them to see the small differences in between them.

All are transpiled on the client side using [Babel](http://babeljs.io/).  Client-side transpiling (transpilation ??) is not recommended for production, this is just an example.   

###m.html

This version is a simple conversion of the [example](http://lhorie.github.io/mithril/getting-started.html#summary) into
ES6.  

The `Todo` class itself becomes the controller and the `view` method is declared `static` within it.  They get mounted by doing:

```js
m.mount(document, {
	controller: Todo,
	view: Todo.view
});
```

Except for the use of ES6 classes and fat arrow functions, the code is still quite similar to the one in the original example.

###ma.html

This version follows Facebook's [Flux](https://facebook.github.io/flux/) architecture, often used with [React](https://facebook.github.io/react/index.html).  However, instead of using Flux directly, it uses the popular [Alt](http://alt.js.org/) library. 

I use the `TodoStore` to store the todo-list.  

Each possible user action corresponds to an action created through `generateActions`: `"addItem"`, `"checkItem"` and `"saveDescr"`.  So, instead of setting the new value directly in the model, each user action simply sends a notification to whom it may concern.  

I believe this is the main benefit of Flux.  With complex pages where several sections of the screen receive information from various sources, it is difficult to manage all the two-way data bindings since models may load and unload just as dynamically as views do. By simply shouting out loud to all whom it might concern that something has happened, each interested party takes its bit of data.  This example, of course, has a very simple page with minimal interactions so this is not evident.

For each existing action, each of the possibly many Stores (that is 'model' in Flux parlance) can register a listener.  Alt's `bindActions` method does that for us by checking all methods starting with `on` so that it matches `onAddItem` to the `addItem` action and so on.  This matching happens just once during initialization.

To trigger a notificacion, you simply call the corresponding action in the `actions` object with whatever payload you want: 

```js
onchange: ev => actions.saveDescr(ev.target.value)
```

When each Store responds to an action, Alt automatically calls `emitChange` for you, unless you explicitely prevent it from doing so (such as with asynchronous processes where the change will happen at a later moment).  This serves for Alt to notify React components that some change has happened and the component needs redrawing.

Mithril works differently.  When some external action happens, be it a user interaction or a server request, it assumes a redraw will be required, and it does this right from the root. Thus, in this example, the controller simply saves a reference to the state of the store and doesn't bother to listen to any notification of changes.


As a simple debugging tool, a snapshot of the store is shown below the horizontal line.

It is tempting to merge the `TodoStore` and `Todo` classes into a single class and then register that merged class as an Alt store and mount it as a Mithril component.  I haven't tried but I don't think it would be a good idea.  Both `alt.createStore` and `m.mount` create instances of that class, each its own separate instance.  There are ways around that, but I don't think it would make matters any clearer.

###ma1.html

In this version, the `autoredraw` feature of Mithril has been bypassed by setting the event listener on the DOM element itself instead of through the `onxxx` pseudo-attribute that Mithril uses.  In order to do that, the DOM element was retrieved via the `config` pseudo-attribute and set with the `addListener` function.  In this way, Mithril will not redraw the page automatically.

Then I listen to change notifications from the store:

```js
todoStore.listen(state => {
	m.startComputation();
	this.list = state.list;
	this.descr = state.descr;
	m.endComputation();
});
```

I activate Mithril's redraw mechanism from within the listener by using `startComputation/endComputation` enclosing the copying of the references to the bits of data this component needs (being such a simple example, this components needs them all).  

This really makes no practical difference to the overall results, the reason being that Mithril would still redraw everything from the root.  React is somewhat cleverer in this in that it redraws only the components whose state has changed and its children.  That is why in React you should not set the `state` property directly but use the `setState` method which will merge (not replace) the new data and also mark the component for redrawing.

###ma2.html

This version is derived from `ma.html` with the addition of an undo stack, which in Alt is very simple.  Since all the stores in Alt are registered with Alt, the method `takeSnapshot` allows you to do that over all stores at once.   So, for every action I might want to undo, I added a line of code pushing a new snapshot into the `undoStack`. The `Undo` button simply pops the latest snapshot from that stack and uses the `bootstrap` method to make it current.  

This feature is also used on isomorphic applications so that a snapshot of the state of the server-side page can be taken and then sent to the client so that it can be bootstrapped with it.  That is why the snapshot is already JSON-encoded.

###mca.html

In `ma1.html` the rendering process always started from the root.  One of the advantages of React is that it only re-renders only what got changed.  In this version, the component is redrawn only when the state of the store has changed.  

To achieve that, I created a `DataContainer` class which handles the data for the contained component.  The concept is described [here](https://www.youtube.com/watch?v=KYzlpRvWZ6c&feature=youtu.be&t=22m48s).  To better understand it, lets look into the `Todo` class towards the bottom of the source file.

The [`Todo` class](https://github.com/Satyam/malt/blob/master/mca.js#L86) is simpler than the one in `ma1.html`, it's main differences are:  

0. It inherits from `DataContainer`.
0. There is no need for a constructor to initialize the state and listen to changes in the store, as that is now handled by `DataContainer`.
0. A `getStores` method returns the stores that this component uses. Since this app uses a single store, it simply returns that one.  It might return an array of stores or an object with the stores as properties and the property names to help map the state for each store into the named properties.
0. The `view` static method is now called `content` and it is an instance method.

The `content` method is the very same as the `view` method in `ma1.html`, the only difference is in its name. If you diff `ma1.js` and `mca.js` the contents of the two methods are exactly the same.  As in `ma1.js` it does not use the `onXxxxx` pseudo-properties but attaches the event listeners directly to the DOM elements to avoid Mithril's auto-redraw.

The trick is in the [`DataContainer` class](https://github.com/Satyam/malt/blob/master/mca.js#L30).  

```js	
	static view(ctrl, ...args) {
		return m("div.data-container", {
			config: (el, isOld) => {
				if (isOld) return;
				ctrl._containerEl = el;
				ctrl.render();
			}
		});
	}
```

The static [`view` method](https://github.com/Satyam/malt/blob/master/mca.js#L61) simply draws a `div.data-container` element but no children. In a real case, both the type of element and its className should be configurable. It then uses the `config` pseudo-attribute to get a reference to this element and finally calls the [`render` method](https://github.com/Satyam/malt/blob/master/mca.js#L55).

```js
	render() {
		m.render(this._containerEl, this.content(this, ...this._args));
	}
```

The `render` method of `DataContainer` uses `m.render` to render into the data container element the actual contents of the component.  This is produced by the `content` method of the `Todo` class.  An empty `content` method is provided as a backstop.

I've tried to deal with parameterized components, though I am not sure if I am doing it right.  Both the controller and the view of a component may receive extra arguments.  That is why you see the `...args` argument both in the constructor and in the `view` to be able to catch those.  There is an issue with Mithril where non-components (not used with `m.component`) receive a reference to the controller twice, that's why it [first has to be discarded](https://github.com/Satyam/malt/blob/master/mca.js#L62).  Something I am also not clear about is whether the extra arguments to a parameterized component may change in between successive redraws.  I assumed (probably wrong) that they might so I check whether the [extra arguments have changed](https://github.com/Satyam/malt/blob/master/mca.js#L66) in between calls and re-render if they have.

In the [constructor](https://github.com/Satyam/malt/blob/master/mca.js#L31) I set up the links in between the stores and the view. Basically I do the following:

```js
	_.merge(this, store.getState());
	store.listen(state => {
		_.merge(this, state);
		this.render();
	});
```

I call the `getState` method of the store and merge its initial state into the controller.  Then I listen to changes in the state of the store and, when detected, I merge the new state and call `render` to reflect it in the UI.  Most of the code in the constructor deals with different ways in which `getStores` can return the stores it connects with, either a single store, an array of stores or an object which lists the stores along with mapping.

This is the big difference in between `ma1.html` and `mca.html`.  In the former, I called [Mithril `startComputation/endComputation`](https://github.com/Satyam/malt/blob/master/ma1.js#L41) to trigger Mithril's native redraw mechanism, which always starts at the root.   Here, I only redraw the components affected in response to a signal from the store that something has changed.  In React, this is triggered by the `setState` method of `React.Component` which, besides merging the new state of the store into the component, it flags the component for redrawing.

I tried to emulate the two mechanisms that React uses to redraw its components.  

* One is the use of the change signals from the stores to [redraw the view](https://github.com/Satyam/malt/blob/master/mca.js#L48).  This is equivalent of using React `setState` method.   
* The other is in response to changes higher up in the hierarchy.  Presumably this would be reflected by [changes in the extra arguments](https://github.com/Satyam/malt/blob/master/mca.js#L66) provided to parameterized components so that the component is redrawn when these parameters change.  This would be equivalent to changes in `this.props` in React. I don't think I got this last part right.
