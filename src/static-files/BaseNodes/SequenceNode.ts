import Node from "./Node";
import { NodeStatus } from "./NodeStatus";

/**
 * Succeeds iff all children succeed.
 */
export default class SequenceNode extends Node
{
    constructor(name: string)
    {
        super(name);
    }
    
    public override async execute(): Promise<NodeStatus>
    {
        for (const child of this.children)
        {
            const childStatus: NodeStatus = await child.execute();
            if (childStatus != NodeStatus.SUCCESS)
            {
                return childStatus;
            }
        }

        return NodeStatus.SUCCESS;
    }
}