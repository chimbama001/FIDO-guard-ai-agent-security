import { StateGraph, END, START } from "@langchain/langgraph";
import { AgentState, type AgentStateType } from "../state.js";
import { planningNode } from "../nodes/planning.js";
import { approvalNode } from "../nodes/approval.js";
import { executionNode } from "../nodes/execution.js";

function routeAfterApproval(state: AgentStateType): "execution" | typeof END {
  return state.pendingApproval?.approved ? "execution" : END;
}

const workflow = new StateGraph(AgentState)
  .addNode("planning", planningNode)
  .addNode("approval", approvalNode)
  .addNode("execution", executionNode)
  .addEdge(START, "planning")
  .addEdge("planning", "approval")
  .addConditionalEdges("approval", routeAfterApproval, ["execution", END])
  .addEdge("execution", END);

export const agentGraph = workflow;
