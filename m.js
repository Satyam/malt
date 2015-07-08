/*globals m, document */
class TodoItem {
	constructor(data) {
		this.descr = m.prop(data.descr);
		this.done = m.prop(false);
	}
}

class Todo {
	constructor() {
		this.list = [];
		this.descr = m.prop("");
	}
	add() {
		if (this.descr()) {
			this.list.push(new TodoItem({
				descr: this.descr()
			}));
			this.descr("");
		}
	}
	static view(todo) {
		return [
			m("input", {
				onchange: m.withAttr("value", todo.descr),
				value: todo.descr()
			}),
			m("button", {
				onclick: todo.add.bind(todo)
			}, "Add"),
			m("table", todo.list.map(task => m("tr", [
					m("td",
						m("input[type=checkbox]", {
							onclick: m.withAttr("checked", task.done),
							checked: task.done()
						})
					),
					m("td", {
						style: {
							textDecoration: task.done() ? "line-through" : "none"
						}
						}, task.descr())
					])
				)
			)
		];
	}
}

m.mount(document, {
	controller: Todo,
	view: Todo.view
});
