import { Webhook } from "svix";
import { headers } from "next/headers";
import { clerkClient, WebhookEvent } from "@clerk/nextjs/server";
import { User } from "@prisma/client";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    throw new Error(
      "Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET);

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", {
      status: 400,
    });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error: Could not verify webhook:", err);
    return new Response("Error: Verification error", {
      status: 400,
    });
  }

  // When user is created or updated
  if (evt.type === "user.created" || evt.type === "role.updated") {
    // Parse the incoming event data
    const data = JSON.parse(body).data;

    // Create a user object with relevant properties
    const user: Partial<User> = {
      id: data.id,
      name: `${data.first_name} ${data.last_name}`,
      email: data.email_addresses[0].email_address,
      picture: data.image_url,
    };
    // If user data is invalid, exit the function
    if (!user) return;

    // Upsert user in the database (update if exists, create if not)
    const dbUser = await db.user.upsert({
      where: {
        email: user.email,
      },
      update: user,
      create: {
        id: user.id!,
        name: user.name!,
        email: user.email!,
        picture: user.picture!,
        role: user.role || "USER",
      },
    });

    // Update user's metadata in Clerk with the role information
    const client = await clerkClient();
    await client.users.updateUserMetadata(data.id, {
      privateMetadata: {
        role: dbUser.role || "USER", // Default role to "USER" if not present in dbUser
      },
    });
  }

  // When user is deleted
  if (evt.type === "user.deleted") {
    // Parse the incoming event data to get the user ID
    const userId = JSON.parse(body).data.id;

    // Delete the user from the database based on the user ID
    await db.user.delete({
      where: {
        id: userId,
      },
    });
  }

  return new Response("Webhook received", { status: 200 });
}
