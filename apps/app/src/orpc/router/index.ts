import {
	createNode,
	deleteNode,
	getNode,
	getNodeAncestors,
	listNodes,
	listNodesDueInRange,
	listOverdueNodes,
	moveNode,
	setNodeDueDate,
	setNodeType,
	toggleNodeExpanded,
	updateNodeContent,
	visibleTree,
} from "@/core/nodes/node.procedures";

export default {
	nodes: {
		list: listNodes,
		get: getNode,
		ancestors: getNodeAncestors,
		visibleTree,
		create: createNode,
		move: moveNode,
		toggleExpanded: toggleNodeExpanded,
		delete: deleteNode,
		updateContent: updateNodeContent,
		setType: setNodeType,
		setDueDate: setNodeDueDate,
		listOverdue: listOverdueNodes,
		listDueInRange: listNodesDueInRange,
	},
};
