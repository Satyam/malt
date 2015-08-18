/*globals m, document, Alt */

var alt = new Alt();

const actions = alt.generateActions("addItem", "checkItem", "saveDescr", "undo");

var undoStack = [];

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
		undoStack.push(alt.takeSnapshot());
	}
	onCheckItem (data) {
		this.list[data.index].done = data.done;
		undoStack.push(alt.takeSnapshot());
	}
	onSaveDescr (descr) {
		this.descr = descr;
	}
	onUndo () {
		if (undoStack.length) {
			alt.bootstrap(undoStack.pop());
		}
	}
}

let todoStore = alt.createStore(TodoStore, "TodoStore");


class Todo {
	constructor() {
		this.state = todoStore.state;
	}
	static view(todo) {
		return [
			m("input", {
				onchange: ev => actions.saveDescr(ev.target.value),
				value: todo.state.descr
			}),
			m("button", {
				onclick: () => actions.addItem(todo.state.descr)
			}, "Add"),
			m("table", todo.state.list.map((task, index) => m("tr", [
					m("td",
						m("input[type=checkbox]", {
							onclick: ev => {
								actions.checkItem({
									index,
									done: ev.target.checked
								});
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
			m("button", {
				onclick: () => actions.undo(),
				disabled: undoStack.length === 0
			}, "Undo"),
			m("ul", undoStack.map(item => m("li", item)))
		];
	}
}

m.mount(document.body, {
	controller: Todo,
	view: Todo.view
});
