"use client"

import * as React from "react"
import { useChat } from "@ai-sdk/react"
import {
  ArrowUpIcon,
  CopyIcon,
  RefreshCcwIcon,
  ShareIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react"

import { Action, Actions } from "@/components/ui/actions"
import { Conversation, ConversationContent } from "@/components/ui/conversation"
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message"
import { ClaudeChatInput } from "@/components/ui/claude-style-chat-input"
import { PromptSuggestion } from "@/components/ui/prompt-suggestion"

const userAvatar = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=80&h=80&q=80"
const assistantAvatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&h=80&q=80"

const promptSuggestions = [
  "Tell me about your experience",
  "What are your key skills?",
  "Show me your best projects",
  "How can we work together?",
  "What's your tech stack?",
]

const actions = [
  { icon: RefreshCcwIcon, label: "Retry" },
  { icon: ThumbsUpIcon, label: "Like" },
  { icon: ThumbsDownIcon, label: "Dislike" },
  { icon: CopyIcon, label: "Copy" },
  { icon: ShareIcon, label: "Share" },
] as const

export function ChatExperience() {
  // Use @ai-sdk/react useChat hook
  const { messages, append, isLoading, setMessages, reload } = useChat();

  // Add initial welcome message if none exist
  React.useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: "Hi! I'm Prashant's AI assistant. Ask me anything about his projects, skills, experience, or how you can collaborate with him."
        }
      ])
    }
  }, [messages.length, setMessages])

  const handleSendMessage = async (data: { message: string; model: string }) => {
    await append({
      role: 'user',
      content: data.message,
    }, {
      body: { model: data.model }
    });
  };

  const handleSuggestionSelect = (suggestion: string) => {
    append({
      role: 'user',
      content: suggestion
    });
  };

  return (
    <div className="flex h-full flex-col bg-white overflow-hidden relative">
      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <Conversation className="flex min-h-full flex-col pb-4">
          <ConversationContent className="flex flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
            {messages.map((message: any) => (
              <div key={message.id} className="flex flex-col gap-2">
                <Message from={message.role}>
                  <MessageAvatar
                    src={message.role === 'user' ? userAvatar : assistantAvatar}
                    name={message.role === 'user' ? 'You' : 'Assistant'}
                  />
                  <div className="flex flex-col gap-2 w-full">
                    <MessageContent className={message.role === 'user' ? 'bg-bg-100' : ''}>
                      {message.content}
                    </MessageContent>

                    {message.role === "assistant" && (
                      <Actions className="ml-10">
                        {actions.map((action) => (
                          <Action
                            key={action.label}
                            label={action.label}
                            onClick={() => {
                              if (action.label === 'Retry') reload();
                              // Add other actions if needed
                            }}
                          >
                            <action.icon className="size-4" />
                          </Action>
                        ))}
                      </Actions>
                    )}
                  </div>
                </Message>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <Message from="assistant">
                <MessageAvatar src={assistantAvatar} name="Assistant" />
                <MessageContent>
                  <div className="flex gap-1.5 items-center h-6">
                    <div className="w-1.5 h-1.5 bg-text-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-text-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-text-400 rounded-full animate-bounce" />
                  </div>
                </MessageContent>
              </Message>
            )}

            {/* Scroll Anchor */}
            <div className="h-12" />
          </ConversationContent>
        </Conversation>
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div className="border-t border-slate-100 bg-white/80 backdrop-blur-md px-4 py-6 sm:px-6 lg:px-8 z-10">
        <div className="mx-auto w-full max-w-4xl space-y-4">

          {/* Suggestions (only when few messages) */}
          {messages.length < 3 && (
            <div className="flex flex-wrap gap-2 justify-center mb-2">
              {promptSuggestions.map((suggestion) => (
                <PromptSuggestion
                  key={suggestion}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  variant="outline"
                  size="sm"
                  className="rounded-full border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 transition hover:border-accent-main hover:text-accent-main hover:bg-accent-main/5"
                >
                  {suggestion}
                </PromptSuggestion>
              ))}
            </div>
          )}

          {/* New Claude Input */}
          <div className="relative">
            <ClaudeChatInput
              onSendMessage={handleSendMessage}
            />
          </div>

          <div className="text-center">
            <p className="text-[10px] text-slate-400">
              AI can make mistakes. Please verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
