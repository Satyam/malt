/*globals m, document, Alt, _ */

var alt = new Alt();

const actions = alt.generateActions("addItem", "checkItem", "saveDescr");

class TodoStore {
	constructor() {
		this.list = [];
		this.descr = "";
		this.bindActions(actions);
	}
	onAddItem(descr) {
		this.descr = "";
		this.list.push({
			descr,
			done: false
		});
	}
	onCheckItem(data) {
		this.list[data.index].done = data.done;
	}
	onSaveDescr(descr) {
		this.descr = descr;
	}
}

let todoStore = alt.createStore(TodoStore);

class DataContainer {
	constructor(...args) {
		this._args = args;
		let stores = this.getStores();
		if (_.isPlainObject(stores)) {
			_.each(stores, (store, key) => {
				this[key] = store.getState();
				store.listen(state => {
					_.merge(this[key], state);
					this.render();
				});
			});
		} else {
			if (!_.isArray(stores)) {
				stores = [stores];
			}
			_.each(stores, store => {
				_.merge(this, store.getState());
				store.listen(state => {
					_.merge(this, state);
					this.render();
				});
			});
		}
	}
	render() {
		m.render(this._containerEl, this.content(this, ...this._args));
	}
	content() {
		return "";
	}
	static view(ctrl, ...args) {
		if (args[0][0] === ctrl) {
			// see: https://github.com/lhorie/mithril.js/issues/765
			args.shift();
		}
		if (!_.isEqual(args, ctrl._args)) {
			ctrl._args = args;
			ctrl.render();
		}
		return m("div.data-container", {
			config: (el, isOld) => {
				if (isOld) return;
				ctrl._containerEl = el;
				ctrl.render();
			}
		});
	}
}

let addListener = (name, fn) => (element, isInit, context) => {
	if (isInit) return;
	element[name] = fn;
	context.onunload = () => element[name] = null;
};

class Todo extends DataContainer {
	getStores () {
		return todoStore;
	}
	content(todo) {
		return [
			m("input", {
				config: addListener("onchange", ev => actions.saveDescr(ev.target.value)),
				value: todo.descr
			}),
			m("button", {
				config: addListener("onclick", () => actions.addItem(todo.descr))
			}, "Add"),
			m("table", todo.list.map((task, index) => m("tr", [
				m("td",
					m("input[type=checkbox]", {
						config: addListener("onclick", ev => actions.checkItem({
							index,
							done: ev.target.checked
						})),
						checked: task.done
					})
				),
				m("td", {
					style: {
						textDecoration: task.done ? "line-through" : "none"
					}
				}, task.descr)
			]))),
			m("hr"),
			m("pre", JSON.stringify(JSON.parse(alt.takeSnapshot()), null, 2))

		];
	}
}

m.mount(document.body, {
	controller: Todo,
	view: Todo.view
});
