# Agent Builder Generator

This project was used to PoC a code-generation feature for [Regression Games'](https://www.regression.gg/) visual Behavior Tree Builder. 
The Builder allowed users to create bots for Minecraft, using [reactflow](https://www.npmjs.com/package/reactflow) to drag and drop nodes into a tree and an LLM to populate node logic.
`reactflow` stores the tree's structure and node contents as a JSON object. This was pushed to RG's server on save, where it could be fetched to re-display the tree in the RG webclient.
We wanted to be able to use this tree config to reconstruct the tree in-code, such that we could run it in our system. A sample config can be found under `src/data`.

This project uses mustache templates to generate Typescript code representing a user-defined tree:
- Classes are generated to represent each Action and Condition Node in the tree. These classes are output to `src/output`. 
- Root and Composite Nodes always run the same logic and could not be customized by the user (aside from the node's label), so these are static files located under `src/static-files`.
- `src/output/index.ts` assembles the tree and provides an entrypoint.
  The `configureBot` and `runTurn` implementations here were specific to RG systems - `configureBot` was called before running the bot (in this case, we used it to construct the tree), and `runTurn` was called once every in-game tick (we used this to call into the Root Node of the tree).

This project was originally created to demonstrate how code generation could be accomplished using the `reactflow` config. This logic was then moved to a Kotlin module in RG's backend.

## Running this Project

Install dependencies then use `ts-node` to write files to the `src/output` directory.

```node
npm install
ts-node src/index.ts
```

Once all files have been generated, the contents of `/output` can essentially be copied & pasted into a botCode project and run in RG: Ultimate Collector.
