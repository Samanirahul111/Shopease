import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { apiResponse, apiError } from "@/lib/auth/middleware";
import { contactFormSchema } from "@/lib/validations/schemas";
import { notifyContactForm } from "@/lib/notifications/notify";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = contactFormSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

    const contact = await prisma.contactForm.create({ data: parsed.data });

    notifyContactForm({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
    }).catch(console.error);

    return apiResponse(null, "Message sent successfully! We'll get back to you soon.", 201);
  } catch (error) {
    return apiError("Failed to send message", 500);
  }
}
