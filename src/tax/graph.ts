import type { CalculationGraph, CalculationNode } from "./types";

export function createGraph(): CalculationGraph {
  return { nodes: {} };
}

export function addNode(graph: CalculationGraph, node: CalculationNode): void {
  graph.nodes[node.id] = node;
}

export function getNode(
  graph: CalculationGraph,
  id: string,
): CalculationNode | undefined {
  return graph.nodes[id];
}

/**
 * Walk `inputs` upward from `id` and return unique ancestor nodes
 * (nodes this calculation depends on), in discovery order.
 */
export function getAncestors(
  graph: CalculationGraph,
  id: string,
): CalculationNode[] {
  const result: CalculationNode[] = [];
  const seen = new Set<string>();

  const visit = (nodeId: string): void => {
    const node = graph.nodes[nodeId];
    if (!node) return;
    for (const inputId of node.inputs) {
      if (seen.has(inputId)) continue;
      seen.add(inputId);
      const input = graph.nodes[inputId];
      if (input) {
        result.push(input);
        visit(inputId);
      }
    }
  };

  visit(id);
  return result;
}

/**
 * Return node ids that list `id` as an input, recursively (downstream dependents).
 */
export function getDescendants(graph: CalculationGraph, id: string): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  const visit = (targetId: string): void => {
    for (const [nodeId, node] of Object.entries(graph.nodes)) {
      if (seen.has(nodeId)) continue;
      if (!node.inputs.includes(targetId)) continue;
      seen.add(nodeId);
      result.push(nodeId);
      visit(nodeId);
    }
  };

  visit(id);
  return result;
}
