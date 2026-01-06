// Re-export schemas
export * from "./schemas.js";

export type ProjectId = string;
export type UserId = string;

export type TaskGraphNode = {
  id: string;
  title: string;
  taskType:
    | "intent_classify"
    | "plan_architecture"
    | "generate_code"
    | "fix_errors"
    | "generate_copy"
    | "generate_legal"
    | "generate_screenshots_spec"
    | "validate_compliance";
  input: Record<string, unknown>;
  dependsOn?: string[];
};

export type TaskGraph = {
  version: "1";
  nodes: TaskGraphNode[];
};
