import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { runCoach, type CoachRunResult } from "@/lib/ai/coach";
import type { CoachRequest } from "@/lib/types";

/**
 * State for the coach graph. Input = CoachRequest; node adds result.
 * Using a graph makes it easy to add steps later (e.g. moderation node, tool node, summarization).
 */
const CoachState = Annotation.Root({
  request: Annotation<CoachRequest>(),
  result: Annotation<CoachRunResult | undefined>()
});

async function runCoachNode(
  state: typeof CoachState.State
): Promise<Partial<typeof CoachState.Update>> {
  const result = await runCoach(state.request);
  return { result };
}

const builder = new StateGraph(CoachState)
  .addNode("run", runCoachNode)
  .addEdge(START, "run")
  .addEdge("run", END);

export const coachGraph = builder.compile();

/**
 * Invoke the coach graph with a request. Returns the same shape as runCoach().
 * Use this when you want to extend the graph later (e.g. add tools or memory).
 */
export async function invokeCoachGraph(request: CoachRequest): Promise<CoachRunResult> {
  const final = await coachGraph.invoke({ request });
  if (!final?.result) {
    throw new Error("Coach graph did not return a result");
  }
  return final.result;
}
