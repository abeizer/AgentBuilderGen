# Agent Builder Generator

This project is part of Regression Games' Agent-Builder. Behavior Trees are built using a visual tool from the client. From this UI, users can construct a tree and populate logic for nodes using GPT. A JSON config stores data required to display the tree using `reactflow`.

This project uses the same config as the client to generate code that can be run by the UserCodeService. From this config, we generate classes representing each Action Node and Condition Node created by the user. We do not generate classes representing the Root Node or any Composite Nodes - these Nodes always run the same logic and cannot be customized by the user (aside from a label), so they are instead defined in and copied from `src/static-files`.

Once the requisite files have been written to `src/output`, we generate the file `src/output/index.ts`  containing implementations for `configureBot` (which constructs the tree) and `runTurn` (which calls `execute()` from the Root Node of the tree).

## Running this Project

Install dependencies then use `ts-node` to write files to the `src/output` directory.

```node
npm install
ts-node src/index.ts
```

Once all files have been generated, the contents of `/output` can essentially be copied & pasted into a botCode project and run in RG: Ultimate Collector.
