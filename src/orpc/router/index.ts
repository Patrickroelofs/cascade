import {
	createNode,
	deleteNode,
	getNode,
	listNodes,
	moveNode,
	setNodeType,
	toggleNodeExpanded,
	updateNodeContent,
	visibleTree,
} from "@/core/nodes/node.procedures";

export default {
	nodes: {
		list: listNodes,
		get: getNode,
		visibleTree,
		create: createNode,
		move: moveNode,
		toggleExpanded: toggleNodeExpanded,
		delete: deleteNode,
		updateContent: updateNodeContent,
		setType: setNodeType,
	},
};
