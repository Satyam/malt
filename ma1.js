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
				config: (element, isInit, context) => {
					if (isInit) return;
					element.onchange = ev => actions.saveDescr(ev.target.value);
					context.onunload = () => element.onclick = null;
				},
				value: todo.descr
			}),
			m("button", {
				config: (element, isInit, context) => {
					if (isInit) return;
					element.onclick = () => actions.addItem(todo.descr);
					context.onunload = () => element.onclick = null;
				}
			}, "Add"),
			m("table", todo.list.map((task, index) => m("tr", [
					m("td",
						m("input[type=checkbox]", {
							config: (element, isInit, context) => {
								if (isInit) return;
								element.onclick = ev => {
									actions.checkItem({
										index,
										done: ev.target.checked
									});
								};
								context.onunload = () => element.onclick = null;
							},
							checked: task.done
						})
					),
					m("td", {
						style: {
							textDecoration: task.done ? "line-through" : "none"
						}
						}, task.descr)
					])
				)
			),
			m("hr"),
			m("pre", JSON.stringify(JSON.parse(alt.takeSnapshot()), null, 2))

		];
	}
}

m.mount(document, {
	controller: Todo,
	view: Todo.view
});
