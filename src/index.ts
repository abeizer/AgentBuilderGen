import * as Handlebars  from "handlebars";
import { readFileSync, writeFile, cpSync, rmSync, existsSync } from "fs";
import * as json from './data/tree.json';

const actionTemplate = Handlebars.compile(readFileSync('src/templates/ActionNode.hbs', 'utf-8').toString());
const conditionTemplate = Handlebars.compile(readFileSync('src/templates/ConditionalNode.hbs', 'utf-8').toString());
const mainScriptTemplate = Handlebars.compile(readFileSync('src/templates/MainScript.hbs', 'utf-8').toString());

/**
 * Represents a node.
 * Some fields come directly from the client config.
 * Others are computed here to make working with templates easier.
 */
class AgentBuilderNode {
    // from config
    label: string;
    prompt: string;
    code: string;

    parent: AgentBuilderNode;
    children: Array<AgentBuilderNode>;
    className: string;
    variableName: string;
}

const nodes: Map<number, AgentBuilderNode> = new Map<number, AgentBuilderNode>();

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


// gather info on each node and generate required files
json.nodes.forEach((jsonEntry) => {

    const node = new AgentBuilderNode();

    // grab data from config
    node.label = jsonEntry.data.label;
    node.prompt = jsonEntry.data.prompt || "";
    node.code = jsonEntry.data.code || "";

    // we will populate these later
    node.children = new Array<AgentBuilderNode>();

    // create a unique classname + variable name for this node
    const className = generateClassName(node.label);
    node.variableName = className[0].toLowerCase() + className.substring(1);

    // generate classes for leaf nodes. 
    // don't do anything special for composite nodes.
    switch(jsonEntry.type) {
        case "actionNode": {
            node.className = className;
            writeFile(getOutputPath(className), actionTemplate(node), () => {});
            break;
        }
        case "conditionalNode": {
            node.className = className;
            writeFile(getOutputPath(className), conditionTemplate(node), () => {});
            break;
        }
        default: {
            node.className = jsonEntry.type[0].toUpperCase() + jsonEntry.type.substring(1);
        }
    };

    // add node to map
    nodes.set(parseInt(jsonEntry.id), node);
});


// populate parent + children
nodes.forEach( (node, key) => {

    const parentEdge = json.edges.find((edge) => parseInt(edge.target) == key);
    if(parentEdge) {
        node.parent = nodes.get(parseInt(parentEdge.source));
    }
    
    // find all edges that connect from this node to another node
    const childEdges = json.edges.filter((edge) => parseInt(edge.source) == key);
    const children: AgentBuilderNode[] = childEdges.flatMap((edge) => nodes.get(parseInt(edge.target)));
    node.children.push(...children);

});

console.log(nodes);
writeFile(getOutputPath("index", false), mainScriptTemplate( {nodes: Array.from(nodes.values()).reverse()} ), (err) => {if (err) console.log(err)});


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



