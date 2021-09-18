export class Session {
	constructor({image, name, tabs}) {
		this.image = image
		this.name = name
		this.tabs = tabs
	}
}

export class ShelvedSession extends Session {
	constructor({bookmarkFolderId, ...args}) {
		super(args)
		this.bookmarkFolderId = bookmarkFolderId
	}
}

export class UnsavedSession extends Session {
	constructor({windowId, ...args}) {
		super(args)
		this.windowId = windowId
	}
}

export class UnshelvedSession extends Session {
	constructor({bookmarkFolderId, windowId, ...args}) {
		super(args)
		this.bookmarkFolderId = bookmarkFolderId
		this.windowId = windowId
	}
}