export const allowedRules = {
  minCommitMessageLength: {
    type: "number",
    default: 5
  },
  disallowTodo: {
    type: "boolean",
    default: false
  },
  disallowConsoleLog: {
    type: "boolean",
    default: false
  },
  disallowVar: {
    type: "boolean",
    default: false
  },
  disallowDebugger: {
    type: "boolean",
    default: false
  },
  requireIssueLink: {
    type: "boolean",
    default: false
  },
  maxFileLines: {
    type: "number",
    default: 300
  }
};