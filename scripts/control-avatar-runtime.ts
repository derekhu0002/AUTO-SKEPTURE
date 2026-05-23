import { AgentRuntime } from "../src/agent-runtime/index.js";
import { AvatarEmbodimentMediator } from "../src/avatar-mediator/index.js";
import {
  StdioBlenderBridge,
  getBridgeOptionsFromEnvironment,
} from "../src/blender-bridge/index.js";

const action = process.argv[2];
const requestId = process.argv[3];

if (!action || !requestId) {
  throw new Error("Expected action and requestId arguments.");
}

const bridge = new StdioBlenderBridge(getBridgeOptionsFromEnvironment());
const runtime = new AgentRuntime(new AvatarEmbodimentMediator(bridge));
const result = await runtime.handleSemanticAvatarAction(action, requestId);

process.stdout.write(`${JSON.stringify(result)}\n`);