import Node from "../Node";
import { NodeStatus } from "../NodeStatus";

/**
 * Returns RUNNING if the child is RUNNING.
 * Returns SUCCESS if the child returns FAILURE.
 * Returns FAILURE if the child returns SUCCESS.
 */
export default class Invert extends Node {

    constructor(node: Node) {
        super("Invert");
        this.addChild(node);
    }
    
    public override async execute(): Promise<NodeStatus>
    {
        const childStatus: NodeStatus = await this.children[0].execute();
        switch(childStatus) {
            case NodeStatus.RUNNING: return NodeStatus.RUNNING;
            case NodeStatus.SUCCESS: return NodeStatus.FAILURE;
            case NodeStatus.FAILURE: return NodeStatus.SUCCESS;
        }
    }
    
}