import { NodeStatus } from "./NodeStatus";

export default abstract class Node
{
    public name: string;
    protected parent: Node;
    protected children: Array<Node> = new Array<Node>();
    protected data: Map<string, any> = new Map<string, any>(); // data is only stored at root node
    protected status: NodeStatus;

    constructor(name: string)
    {
        this.name = name;
    }
    
    public abstract execute(): Promise<NodeStatus>;

    public addChild(child: Node): void
    {
        this.children.push(child);
        child.parent = this;
    }

    /**
     * Retrieve data from root node
     */
    protected getData<T>(key: string): any
    {
        let node: Node = this;
        while(node.parent != null) {
            node = node.parent;
        }
        return node.data.get(key) as T;
    }

    /**
     * Set data at root node
     */
    protected setData(key: string, value: any): void
    {
        let node: Node = this;
        while(node.parent != null) {
            node = node.parent;
        }
        node.data.set(key, value);
    }

    /**
     * Clears data from the root node. 
     * Returns true if there was data to clear
     */
    protected clearData(key: string): boolean
    {
        let node: Node = this;
        while(node.parent != null) {
            node = node.parent;
        }
        return node.data.delete(key);
    }
}
