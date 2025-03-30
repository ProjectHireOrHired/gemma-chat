"use client";

import { useState, useRef, useEffect } from "react";
import { TextField, IconButton, CircularProgress, Chip } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { motion } from "framer-motion";
import ReactMarkdown from 'react-markdown';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Commonly used prompts
const samplePrompts = [
    "Explain [topic] in simple terms.",
    "Summarize this text in 3 sentences: [paste text]",
    "Write a blog post on [topic] with an engaging introduction.",
    "Write a professional resume summary for a [job title] with [X] years of experience.",
    "What are the most common interview questions for a [job title]?",
    "Write a [language] function to [task].",
    "Act as a [role] and answer my question: [question]",
    "Translate this text to [language]: [text]",
    "Create a daily schedule for a [profession].",
    "Write a short story about [topic]."
];

export default function Chat() {
    const [prompt, setPrompt] = useState("");
    const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchResponse = async (userPrompt: string) => {
        if (!userPrompt.trim()) return;

        const newMessages = [...messages, { role: "user", content: userPrompt }];
        setMessages(newMessages);
        setPrompt("");
        setLoading(true);

        if (!apiUrl) {
            setLoading(false);
            return;
        }

        const res = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: userPrompt }),
        });

        if (!res.body) {
            setLoading(false);
            return;
        }

        // Process streaming response
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let aiResponse = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            aiResponse += decoder.decode(value, { stream: true });
            setMessages([...newMessages, { role: "ai", content: aiResponse }]);
        }

        setLoading(false);
    };

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-[#FDF6E3] text-black p-4">
            {/* Chat Window */}
            <div className="xl:w-1/2 w-full flex flex-col flex-grow bg-[#F5DEB3] rounded-lg shadow-lg p-6 overflow-hidden">
                {/* Chat Messages */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 h-full">
                    {messages.map((msg, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`p-3 rounded-lg ${msg.role === "user" ? "ml-auto bg-[#FFD54F] text-right" : "mr-auto bg-[#FDF0C2]"}`}
                            style={{
                                width: "fit-content",
                                minWidth: "50px",
                                maxWidth: "80%",
                                wordBreak: "break-word", // Add this line
                                overflowWrap: "break-word", // Add this line for older browsers
                            }}
                        >
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </motion.div>
                    ))}
                    {loading && <CircularProgress sx={{ color: "#FDF0C2" }} className="ml-4" />}
                </div>

                <div className="w-full sticky bottom-0">
                    {/* Scrollable Suggested Prompts as Chips */}
                    <div className="mt-4 max-h-32 overflow-y-auto flex flex-wrap justify-center gap-2">
                        {samplePrompts.map((sp, index) => (
                            <Chip
                                key={index}
                                label={sp}
                                onClick={() => setPrompt(sp)}
                                className="bg-[#FDF0C2] text-[#5A4A32] hover:bg-[#FFD54F] cursor-pointer p-2"
                                sx={{
                                    backgroundColor: "#FDF0C2",
                                    ":hover": {
                                        backgroundColor: "#FFD54F"
                                    }
                                }}
                            />
                        ))}
                    </div>

                    {/* Styled Input Bar */}
                    <div className="p-4 mt-4">
                        <div className="flex items-center bg-[#FDF0C2] rounded-2xl px-4 py-2 w-full">
                            <TextField
                                variant="standard"
                                placeholder="Send a message..."
                                fullWidth
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                multiline
                                maxRows={4}
                                InputProps={{
                                    disableUnderline: true,
                                    className: "text-black py-2"
                                }}
                            />
                            <IconButton onClick={() => fetchResponse(prompt)} style={{ color: "#E5C07B" }}>
                                <SendIcon />
                            </IconButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
