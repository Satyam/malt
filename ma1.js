/*globals m, document, Alt */

var alt = new Alt();

const actions = alt.generateActions("addItem", "checkItem", "saveDescr");

class TodoStore {
	constructor () {
		this.list = [];
		this.descr = "";
		this.bindActions(actions);
	}
	onAddItem (descr) {
		this.descr = "";
		this.list.push({
			descr,
			done: false
		});
	}
	onCheckItem (data) {
		this.list[data.index].done = data.done;
	}
	onSaveDescr (descr) {
		this.descr = descr;
	}
}

let todoStore = alt.createStore(TodoStore);

let addListener = (name, fn) => (element, isInit, context) => {
	if (isInit) return;
	element[name] = fn;
	context.onunload = () => element[name] = null;
};

class Todo {
	constructor() {
		var initialState = todoStore.getState();
		this.list = initialState.list;
		this.descr = initialState.descr;
		todoStore.listen(state => {
			m.startComputation();
			this.list = state.list;
			this.descr = state.descr;
			m.endComputation();
		});
	}
	static view(todo) {
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

m.mount(document, {
	controller: Todo,
	view: Todo.view
});
