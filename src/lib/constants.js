import { Sparkles, Code2, PenLine, GraduationCap } from "lucide-react";

export const APP_NAME = "Zehnix AI";


export const MODELS = [
    {
        id: "gemini-3.5-flash-lite",
        name: "Gemini 3.5 Flash Lite",
        description: "Fastest responses for simple, everyday tasks",
    },
    {
        id: "gemini-3.7-flash",
        name: "Gemini 3.7 Flash",
        description: "Balanced speed and performance for general reasoning",
    },
    {
        id: "gemini-3.8-flash",
        name: "Gemini 3.8 Flash",   
        description: "Next-gen flagship model for maximum precision and complex tasks",
    }
];

export const SUGGESTED_PROMPTS = [
    {
        icon: PenLine,
        title: "Draft an email",
        subtitle: "asking my landlord for a repair",
        prompt: "Draft a polite email to my landlord asking them to fix a leaking kitchen tap.",
    },
    {
        icon: Code2,
        title: "Debug this function",
        subtitle: "explain what's wrong with my code",
        prompt: "Here's a function that's supposed to reverse a linked list but isn't working. Can you help me debug it?",
    },
    {
        icon: GraduationCap,
        title: "Explain a concept",
        subtitle: "like I'm new to the topic",
        prompt: "Explain how neural networks learn, in simple terms, with an analogy.",
    },
    {
        icon: Sparkles,
        title: "Brainstorm ideas",
        subtitle: "for a weekend side project",
        prompt: "Give me 5 small, buildable side project ideas for a weekend, using Next.js.",
    },
];

/**
 * PHASE 2 TODO: replace this with a real call to the Gemini API
 * (e.g. POST to /api/chat, which streams from
 * generativelanguage.googleapis.com). This function only exists
 * so the UI has something to render and stream while you're
 * still on the UI phase.
 */
export function getMockReply(userText) {
    const trimmed = userText.trim().toLowerCase();

    if (trimmed.includes("code") || trimmed.includes("function") || trimmed.includes("debug")) {
        return `Here's a cleaned-up version with the issue fixed:

\`\`\`javascript
function reverseList(head) {
  let prev = null;
  let current = head;

  while (current !== null) {
    const next = current.next; // save next before overwriting
    current.next = prev;
    prev = current;
    current = next;
  }

  return prev; // new head
}
\`\`\`

The bug was usually in the order of reassignment — overwriting \`current.next\` **before** saving a reference to the original next node loses the rest of the list. Saving \`next\` first fixes that.

Want me to walk through it step by step with an example list?`;
    }

    return `Got it — here's a first pass:

This is a placeholder response so you can see how streaming text, **markdown**, and layout behave. Once you wire up the real Gemini API in \`/api/chat\`, swap \`getMockReply\` out for the actual model response.

A few things worth noting about the current UI:

- Messages support *markdown*, lists, and \`inline code\`
- Code blocks get syntax highlighting and a copy button
- Long responses wrap and scroll cleanly on mobile

> Replace this function once your API route is ready.`;
}