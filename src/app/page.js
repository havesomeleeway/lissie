"use client";
import { useState, useEffect, useRef } from "react";
import {
  Heading,
  TextField,
  Select,
  Button,
  Box,
  Flex,
  Container,
  TextArea,
} from "@radix-ui/themes";
import * as ScrollArea from "@radix-ui/react-scroll-area";

export default function Page() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [analysisResults, setAnalysisResults] = useState(null);
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

// Handle "Start Over"
const handleStartOver = () => {
  setMessages([]);
  setInput("");
  setAnalysisResults(null); // Reset analysis results
  setSelectedTopic(""); // Reset topic selection
  setQuestionCount(0); // Reset question count
};

  const handleTopicSelection = async (value) => {
    setSelectedTopic(value);
    setCustomTopic("");
    startDiscussion(value);
  };

  const handleCustomTopicSubmission = async () => {
    if (!customTopic.trim()) return;
    setSelectedTopic(customTopic);
    setCustomTopic("");
    startDiscussion(customTopic);
  };

  const startDiscussion = async (topic) => {
    setMessages([]);
    const initialMessages = [
      {
        role: "system",
        content: `You are discussing the topic: ${topic}. Start with a broad question in Singapore's context and ask how the interviewee feels they are being affected by it.`,
      },
    ];

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: initialMessages,
        topic,
        questionCount: 0,
      }),
    });

    const data = await response.json();
    setMessages([
      { role: "assistant", content: `Let's talk about ${topic}.` },
      {
        role: "assistant",
        content: data.result || "What are your thoughts on this topic?",
      },
    ]);
    inputRef.current?.focus();
  };

  const handleUserResponse = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");

    if (questionCount + 1 >= MAX_QUESTIONS) {
      setIsLoading(true);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Thank you for your participation! Analyzing your answers...",
        },
      ]);

      try {
        console.log("Calling sentiment API...");
        const response = await fetch("/api/sentiment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: updatedMessages }),
        });

        const sentimentData = await response.json();
        console.log("Sentiment API Response:", sentimentData);

        setAnalysisResults(sentimentData);
      } catch (error) {
        console.error("Error fetching sentiment analysis:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "An error occurred while analyzing your responses.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }

      return;
    }

    // Handle regular response if MAX_QUESTIONS is not reached
    setIsLoading(true);
    setQuestionCount((prev) => prev + 1);

    try {
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
    } catch (error) {
      console.error("Error fetching chat response:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "An error occurred while processing your response.",
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleUserResponse();
    }
  };

  return (
    <div>
      <Container size="3">
        <Heading as="h1" align="center" mb="2">
          Hello, I am Lissie, your AI Interviewer
        </Heading>

        <Flex direction="column" gap="4" align="center" mt="4">
          {!selectedTopic ? (
            <Box width="100%">
              <Heading as="h2" mb="2">
                Let's start by selecting a topic and i will ask you 10 questions.
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

              <TextField.Root
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Or type your own topic..."
                style={{ marginTop: "10px", width: "100%" }}
              />
              <Button
                onClick={handleCustomTopicSubmission}
                style={{ marginTop: "10px" }}
              >
                Submit Topic
              </Button>
            </Box>
          ) : (
            <Heading as="h2" size="5">
              Topic: {selectedTopic}
            </Heading>
          )}

          <Box width="100%" radius="md" shadow="sm" padding="3">
            <ScrollArea.Root>
              <ScrollArea.Viewport>
                {messages.map((msg, idx) => (
                  <p key={idx} style={{ marginBottom: "0.5rem" }}>
                    <strong>{msg.role === "user" ? "You" : "Lissie"}:</strong>{" "}
                    {msg.content}
                  </p>
                ))}
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar orientation="vertical" />
            </ScrollArea.Root>
          </Box>

          {analysisResults && (
            <Box
              width="100%"
              radius="md"
              shadow="sm"
              padding="3"
              style={{ marginTop: "20px" }}
            >
              <Heading as="h3" mb="2">
                Analysis Results
              </Heading>
              <ul>
                <li>
                  <strong>Overall Sentiment:</strong>{" "}
                  {analysisResults.overallSentiment}
                </li>
                <li>
                  <strong>Summary:</strong> {analysisResults.summary}
                </li>
                <li>
                  <strong>Positive Elements:</strong>
                  {analysisResults.positiveElements?.length > 0 ? (
                    <ul>
                      {analysisResults.positiveElements.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    "None identified"
                  )}
                </li>
                <li>
                  <strong>Negative Elements:</strong>
                  {analysisResults.negativeElements?.length > 0 ? (
                    <ul>
                      {analysisResults.negativeElements.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    "None identified"
                  )}
                </li>
                <li>
                  <strong>Neutral Elements:</strong>
                  {analysisResults.neutralElements?.length > 0 ? (
                    <ul>
                      {analysisResults.neutralElements.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    "None identified"
                  )}
                </li>
                <li>
                  <strong>Key Themes:</strong>
                  {analysisResults.keyThemes?.length > 0 ? (
                    <ul>
                      {analysisResults.keyThemes.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    "None identified"
                  )}
                </li>
              </ul>
              <Button variant="classic" size="3" onClick={handleStartOver}>
                {" "}
                Start Over{" "}
              </Button>
            </Box>
          )}

          <Flex direction="row" gap="3" width="100%" align="end">
            <TextArea
              autoComplete="true"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your response here..."
              cols="100"
              rows={4}
              resize="none"
              disabled={isLoading || questionCount >= MAX_QUESTIONS}
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
                ? "Analyzing..."
                : "Send"}
            </Button>
          </Flex>
        </Flex>
      </Container>
    </div>
  );
}
