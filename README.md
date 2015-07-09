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



