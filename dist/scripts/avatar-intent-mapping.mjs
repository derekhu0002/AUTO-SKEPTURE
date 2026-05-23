const ACTIONS = [
    "thinking",
    "confirming",
    "neutral_idle",
    "restrained_apology",
];
const RAW_RIG_PATTERN = /骨骼|bone|shape key|shapekey|rig|旋转|rotation|位移|transform|姿势层|pose layer/i;
const UNSUPPORTED_MOTION_PATTERN = /跳舞|dance|攻击|attack|战斗|fight|性感|sexual|挑逗|seductive|夸张|exaggerated/i;
const RULES = [
    {
        action: "thinking",
        patterns: [/思考|想一想|考虑|斟酌|thinking|think|listen|listening|wait|waiting|ponder/i],
    },
    {
        action: "confirming",
        patterns: [/确认|完成|结束|同意|点头|acknowledge|acknowledging|confirm|confirmed|finish|done|success/i],
    },
    {
        action: "neutral_idle",
        patterns: [/回到中立|中立|待机|静止|重置|恢复|冷静|idle|neutral|reset|rest|calm/i],
    },
    {
        action: "restrained_apology",
        patterns: [/抱歉|道歉|不好意思|sorry|apology|apologize|failure|mistake/i],
    },
];
export function getSupportedAvatarActions() {
    return [...ACTIONS];
}
export function resolveAvatarIntent(intent) {
    const normalizedIntent = intent.trim();
    if (!normalizedIntent) {
        return {
            kind: "error",
            message: "Avatar intent is empty.",
        };
    }
    if (RAW_RIG_PATTERN.test(normalizedIntent)) {
        return {
            kind: "unsupported",
            message: "Low-level rig control is outside the supported avatar contract.",
            suggestedAction: "thinking",
        };
    }
    if (UNSUPPORTED_MOTION_PATTERN.test(normalizedIntent)) {
        return {
            kind: "unsupported",
            message: "Requested motion is outside the approved semantic avatar vocabulary.",
            suggestedAction: "confirming",
        };
    }
    for (const rule of RULES) {
        if (rule.patterns.some((pattern) => pattern.test(normalizedIntent))) {
            return {
                kind: "resolved",
                action: rule.action,
                reason: `Matched semantic intent for '${rule.action}'.`,
            };
        }
    }
    return {
        kind: "unsupported",
        message: "Could not map the request to a supported semantic avatar action.",
        suggestedAction: "neutral_idle",
    };
}
