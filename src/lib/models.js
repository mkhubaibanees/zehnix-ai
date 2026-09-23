import mongoose from "mongoose";

// 1. Define the structure for a single message in the chat
const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
        enum: ["user", "assistant"]
    },
    content: {
        type: String,
        required: true
    },
    attachments: {
        type: Array,
        default: []
    }
    // We can add fields for attachments (images/PDFs) here later
});

// 2. Define the structure for the entire chat session
const chatSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true
        }, // This will securely store the Clerk User ID
        title: {
            type: String,
            default: "New Chat"
        },
        messages: [messageSchema], // Embeds the array of messages defined above
    },
    {
        timestamps: true // Automatically creates 'createdAt' and 'updatedAt' fields
    }
);

// 3. Export the model (prevents Next.js hot-reload from crashing by compiling the model only once)
export const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema); 