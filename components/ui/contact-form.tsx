"use client"

import React, { useState } from "react"
import { BackgroundBeams } from "./background-beams"
import { Input } from "./input"
import { Label } from "./label"
import { Button } from "./button"
import { Checkbox } from "./checkbox"
import { Textarea } from "./textarea"
import { useTranslations } from "next-intl"

export function ContactForm() {
  const t = useTranslations("Contact")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    subscribe: false,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      setSubmitStatus("success")
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        subscribe: false,
      })
    } catch (error) {
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="h-[40rem] w-full rounded-md bg-background relative flex flex-col items-center justify-center antialiased">
      <div className="max-w-2xl mx-auto p-4 relative z-10">
        <h1 className="text-4xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-900 to-neutral-600">
          {t("title")}
        </h1>
        <p className="mt-4 font-normal text-base text-neutral-600 max-w-lg text-center mx-auto">
          {t("description")}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <Label htmlFor="name" className="text-neutral-800 font-medium">
              {t("name")}
            </Label>
            <Input
              id="name"
              type="text"
              placeholder={t("placeholders.name")}
              required
              className="mt-2"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-neutral-800 font-medium">
              {t("email")}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t("placeholders.email")}
              required
              className="mt-2"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="subject" className="text-neutral-800 font-medium">
              {t("subject")}
            </Label>
            <Input
              id="subject"
              type="text"
              placeholder={t("placeholders.subject")}
              required
              className="mt-2"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="message" className="text-neutral-800 font-medium">
              {t("message")}
            </Label>
            <Textarea
              id="message"
              required
              className="mt-2"
              placeholder={t("placeholders.message")}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="subscribe"
              checked={formData.subscribe}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, subscribe: checked as boolean })
              }
            />
            <Label htmlFor="subscribe" className="text-neutral-800 font-medium">
              {t("subscribe")}
            </Label>
          </div>

          <Button
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("sending") : t("send")}
          </Button>

          {submitStatus === "success" && (
            <p className="text-green-500 text-center" role="status">{t("success")}</p>
          )}
          {submitStatus === "error" && (
            <p className="text-red-500 text-center" role="alert">{t("error")}</p>
          )}
        </form>
      </div>
      <BackgroundBeams />
    </div>
  )
} 
