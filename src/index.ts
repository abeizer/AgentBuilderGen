import * as Handlebars  from "handlebars";
import { readFileSync, writeFile, cpSync, rmSync, existsSync } from "fs";
import * as json from './data/tree.json';

const actionTemplate = Handlebars.compile(readFileSync('src/templates/ActionNode.hbs', 'utf-8').toString());
const conditionTemplate = Handlebars.compile(readFileSync('src/templates/ConditionalNode.hbs', 'utf-8').toString());
const mainScriptTemplate = Handlebars.compile(readFileSync('src/templates/MainScript.hbs', 'utf-8').toString());

enum NodeType {
    ROOT =  "rootNode",
    ACTION =  "actionNode",
    CONDITION = "conditionalNode",
    DECORATOR = "decoratorNode" 
}

/**
 * Represents a node with additional info.
 * Some fields come directly from the client config.
 * Others are computed here to make working with templates easier.
 */
class AgentBuilderNode {
    // from config
    id: number;
    type: NodeType;
    label?: string;
    prompt?: string;
    code?: string;
    position: number;

    parent: AgentBuilderNode;
    children: Array<AgentBuilderNode>;
    className: string;
    variableName: string;
    isDecorator: boolean = false;
}

/**
 * Map of ID : Node
 * Contains all nodes in the config
 */
const nodeMap: Map<number, AgentBuilderNode> = new Map<number, AgentBuilderNode>();

/**
 * Array of nodes that we will ultimately feed into template.
 * Nodes appear in this list from the bottom of the tree upwards.
 */
const nodeList: Array<AgentBuilderNode> = new Array<AgentBuilderNode>();

/**
 * Returns file path for generated classes
 */
function getOutputPath(filename: string, lib: boolean = true) {
    return lib ? `src/output/lib/${filename}.ts` : `src/output/${filename}.ts`;
}

/**
 * Converts a Node's label to a valid typescript class name
 */
function generateClassName(label: string) {
    return label.toLowerCase()
                .replace(/[^a-z]/g, ' ')
                .split(' ')
                .map((word) => { 
                    return word ? word[0].toUpperCase() + word.substring(1) : ''; 
                })
                .join('');
}


///////////////////////////////////////////////////////////////////////////////////////

// cleanup any existing files
if(existsSync("./src/output")) {
    rmSync("./src/output", {recursive: true});
}

// copy class files for Node, root, composite nodes, etc. into the output directory 
cpSync("./src/static-files", "./src/output/lib", {recursive: true});


// convert json into a better format for this task
json.nodes.forEach((jsonEntry) => {

    const node = new AgentBuilderNode();

    // grab data from config
    node.id = parseInt(jsonEntry.id);
    node.type = jsonEntry.type as NodeType;
    node.isDecorator = node.type == NodeType.DECORATOR;
    node.label = jsonEntry.data.label || `Node ${node.id}`;
    node.prompt = jsonEntry.data.prompt || "";
    node.code = jsonEntry.data.code || "";
    node.position = jsonEntry.position.x;

    // we will populate these later
    node.children = new Array<AgentBuilderNode>();

    // create a unique classname + variable name for this node
    const className = generateClassName(node.label);
    node.variableName = className[0].toLowerCase() + className.substring(1);

    if(node.type == NodeType.ACTION || node.type == NodeType.CONDITION) {
        // only leaf nodes will have dynamically-created classes
        node.className = className;
    }
    else if(node.type == NodeType.DECORATOR) {
        node.className = jsonEntry.data.subtype[0].toUpperCase() + jsonEntry.data.subtype.substring(1);
    }
    else {
        node.className = jsonEntry.type[0].toUpperCase() + jsonEntry.type.substring(1);
    }

    // add node to map
    nodeMap.set(node.id, node);
});

// We will walk the tree from root node. 
// We do this to avoid processing orphaned nodes.
const toProcess: Array<AgentBuilderNode> = new Array<AgentBuilderNode>();
toProcess.push(nodeMap.get(parseInt(json.nodes.find((node) => node.type == "rootNode").id)));
while(toProcess.length > 0) {
    
    const currentNode = toProcess.pop();
    nodeList.unshift(currentNode);

    // find all edges that connect from this node to another node
    const childEdges = json.edges.filter((edge) => parseInt(edge.source) == currentNode.id);
    const children: AgentBuilderNode[] = childEdges.flatMap((edge) => nodeMap.get(parseInt(edge.target)));
    children.sort((a,b) => a.position - b.position);
    children.forEach((child) => {
        child.parent = currentNode;
        currentNode.children.push(child);
        toProcess.push(child);
    });

    // generate classes if this is a leaf node
    switch(currentNode.type) {
        case NodeType.ACTION: {
            writeFile(getOutputPath(currentNode.className), actionTemplate(currentNode), () => {});
            break;
        }
        case NodeType.CONDITION: {
            writeFile(getOutputPath(currentNode.className), conditionTemplate(currentNode), () => {});
            break;
        }
    };
}

// console.log(nodeMap);
// console.log(nodeList);
writeFile(getOutputPath("index", false), mainScriptTemplate( {nodes: nodeList} ), (err) => {if (err) console.log(err)});


// console.log(JSON.stringify(
//     `public override async execute(): Promise<NodeStatus> {
//         const bot = this.getData<RGBot>("bot");
//         let wanderDistance = this.getData<number>("wanderDistance");
//         if(wanderDistance === undefined) { // modified
//             wanderDistance = 1;
//         }
        
//         const success = await bot.wander(wanderDistance, wanderDistance);
//         return success ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
//     }`
// ));



