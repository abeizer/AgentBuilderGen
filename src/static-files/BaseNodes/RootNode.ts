import Node from "./Node";
import { NodeStatus } from "./NodeStatus";
import { RGBot } from "rg-bot";

export default class RootNode extends Node {

    constructor(name: string, bot: RGBot) {
        super(name);
        this.setData("bot", bot);
    }

    public override async execute(): Promise<NodeStatus>
    {
        if (this.children.length > 0)
        {
            return await this.children[0].execute();
        }
        return NodeStatus.FAILURE;
    }

}