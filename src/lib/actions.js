"use server"; // Yeh line batati hai ke yeh code strictly secure backend par chalega, browser mein nahi!

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "./mongodb";
import { Chat } from "./models";

export async function getChatHistory() {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectToDatabase();


        const chats = await Chat.find({ userId })
            .select("title updatedAt")
            .sort({ updatedAt: -1 });

        return JSON.parse(JSON.stringify(chats));
    } catch (error) {
        console.error("Error fetching chats:", error);
        return [];
    }
}

export async function saveNewChat(title, messages) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectToDatabase();

        const newChat = await Chat.create({
            userId,
            title,
            messages,
        });

        return JSON.parse(JSON.stringify(newChat));
    } catch (error) {
        console.error("Error saving chat:", error);
        throw new Error("Failed to save chat");
    }
}

export async function updateChat(chatId, messages) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectToDatabase();

        await Chat.findOneAndUpdate(
            { _id: chatId, userId },
            { messages }
        );

        return true;
    } catch (error) {
        console.error("Error updating chat:", error);
        return false;
    }
}

export async function getChatById(chatId) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectToDatabase();

        const chat = await Chat.findOne({ _id: chatId, userId });
        return JSON.parse(JSON.stringify(chat));
    } catch (error) {
        console.error("Error fetching chat by id:", error);
        return null;
    }
}


export async function deleteChat(chatId) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectToDatabase();
        await Chat.findOneAndDelete({ _id: chatId, userId });

        return true;
    } catch (error) {
        console.error("Error deleting chat:", error);
        return false;
    }
}

export async function renameChat(chatId, newTitle) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await connectToDatabase();
        await Chat.findOneAndUpdate(
            { _id: chatId, userId },
            { title: newTitle }
        );

        return true;
    } catch (error) {
        console.error("Error renaming chat:", error);
        return false;
    }
}