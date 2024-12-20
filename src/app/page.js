"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabaseClient";
import {
  Heading,
  TextField,
  Select,
  Button,
  Box,
  Flex,
  Container,
  Section,
  TextArea,
} from "@radix-ui/themes";
import * as ScrollArea from "@radix-ui/react-scroll-area";

export default function Page() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const inputRef = useRef(null);

  const MAX_QUESTIONS = 10;
  const topics = [
    "High Cost of Living",
    "Housing Issues",
    "Work-Life Balance",
    "Aging Population",
    "Traffic and Public Transport",
  ];

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading, messages]);

  const handleTopicSelection = async (value) => {
    setSelectedTopic(value);
    setMessages([]);
    const initialMessages = [
      {
        role: "system",
        content: `You are discussing the topic: ${value}. Start with a broad question in Singapore's context and ask how the interviewee feels they are being affected by it.`,
      },
    ];

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: initialMessages,
        topic: value,
        questionCount: 0,
      }),
    });

    const data = await response.json();
    setMessages([
      { role: "assistant", content: `Let's talk about ${value}.` },
      {
        role: "assistant",
        content: data.result || "What are your thoughts on this topic?",
      },
    ]);
    inputRef.current?.focus();
  };

  const handleUserResponse = async () => {
    if (!input.trim()) return;

    if (questionCount >= MAX_QUESTIONS) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Thank you for your participation!" },
      ]);
      return;
    }

    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setQuestionCount((prev) => prev + 1);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: updatedMessages,
        questionCount: questionCount + 1,
        topic: selectedTopic,
      }),
    });

    const data = await response.json();
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: data.result || "No response from AI." },
    ]);
    setIsLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleUserResponse();
    }
  };

  return (
    <div>
      <Container size="3" padding="4">
        <Section padding="4" radius="md" shadow="sm">
          <Heading
            as="h1"
            size="6"
            align="center"
            mb="4"
            style={{ fontFamily: "Noto Serif, serif" }}
          >
            Hello, I am Lissie, your AI Researcher
          </Heading>
        </Section>

        <Flex direction="column" gap="4" align="center" mt="4">
          {!selectedTopic ? (
            <Box width="100%">
              <Heading
                as="h2"
                size="4"
                mb="2"
                style={{ fontFamily: "Noto Serif, serif" }}
              >
                Select a topic
              </Heading>

              <Select.Root
                value={selectedTopic}
                onValueChange={handleTopicSelection}
                size="2"
              >
                <Select.Trigger placeholder="Select a topic" />
                <Select.Content position="popper" sideOffset={5}>
                  {topics.map((topic) => (
                    <Select.Item key={topic} value={topic}>
                      {topic}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>
          ) : (
            <Heading as="h2" size="5" style={{ fontFamily: "Noto Serif, serif" }}>
              Topic: {selectedTopic}
            </Heading>
          )}

          <Box
            width="100%"
            radius="md"
            shadow="sm"
            padding="3"
          >
            <ScrollArea.Root>
              <ScrollArea.Viewport>
                {messages.map((msg, idx) => (
                  <p key={idx} style={{ marginBottom: "0.5rem" }}>
                    <strong>{msg.role === "user" ? "You" : "Lissie"}:</strong>{" "}
                    {msg.content}
                  </p>
                ))}
                {questionCount > 0 && (
                  <p
                    style={{
                      textAlign: "right",
                      fontSize: "0.9rem",
                      marginTop: "1rem",
                    }}
                  >
                    {questionCount}/{MAX_QUESTIONS} questions asked
                  </p>
                )}
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar orientation="vertical" />
            </ScrollArea.Root>
          </Box>

          <Flex
  direction="row"
  gap="3"
  width="100%"
  align="end" // Ensures the button aligns with the bottom of the input box
>
  <TextArea
  autoComplete="true"
    ref={inputRef}
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={handleKeyPress}
    placeholder="Type your response here..."
    cols="50"
    rows={4} // Limits to 4 rows
resize='none'
    disabled={isLoading || questionCount >= MAX_QUESTIONS}
    width="60ch" // Takes up all available width
    variant="classic"
  />
  <Button
    variant="classic"
    size="3"
    disabled={isLoading || questionCount >= MAX_QUESTIONS}
    onClick={handleUserResponse}
  >
    {isLoading
      ? "Thinking..."
      : questionCount >= MAX_QUESTIONS
      ? "Done"
      : "Send"}
  </Button>
</Flex>
        </Flex>
      </Container>
    </div>
  );
}
