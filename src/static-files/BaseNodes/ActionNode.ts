import Node from "./Node";
import { NodeStatus } from "./NodeStatus";

/**
 * Leaf Node that represents an action that the bot will perform
 */
export default abstract class ActionNode extends Node
{
    public abstract execute(): Promise<NodeStatus>;
}