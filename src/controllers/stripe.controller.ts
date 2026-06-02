import type { Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../lib/prisma.js";
import stripe from "../config/stripe.js";
import { sendEmail } from "../config/email.js";
import { createNotification } from "../services/notifications.service.js";
import { bookingConfirmationEmail, bookingWaitlistEmail } from "../templates/email.templates.js";

type BookingEmailData = {
  userEmail: string;
  fullName: string;
  roomName: string;
  checkIn?: Date | null;
  checkOut?: Date | null;
  status: "CONFIRMED" | "WAITLISTED";
  queuePosition: number | null;
};

const logActivity = async (userId: string | undefined, action: string, details: string) => {
  try {
    let email: string | undefined = undefined;
    if (userId) {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      email = u?.email;
    }
    await prisma.activityLog.create({
      data: {
        userId: userId ?? null,
        userEmail: email ?? null,
        action,
        details,
      },
    });
  } catch (err) {
    console.error("Failed to log Stripe activity:", err);
  }
};

export const stripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    return res.status(400).send("Missing Stripe signature header");
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, signature, process.env["STRIPE_WEBHOOK_SECRET"] ?? "");
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`);
  }

  try {
    let bookingEmailData: any = null;

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.bookingId;

        if (!bookingId || typeof bookingId !== "string") {
          return res.status(400).send("Missing bookingId in Stripe session metadata");
        }

        const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : undefined;
        let chargeId: string | null = null;
        let receiptUrl: string | null = null;

        if (paymentIntentId) {
          const paymentIntent = (await stripe.paymentIntents.retrieve(paymentIntentId, {
            expand: ["charges.data.balance_transaction"],
          })) as Stripe.PaymentIntent & { charges?: Stripe.ApiList<Stripe.Charge> };
          const charge = paymentIntent.charges?.data?.[0];
          chargeId = charge?.id ?? null;
          receiptUrl = charge?.receipt_url ?? null;
        }

        await prisma.$transaction(async (tx) => {
          const booking = await tx.booking.findUnique({
            where: { id: bookingId },
            include: { user: { select: { email: true, fullName: true } } },
          });
          if (!booking) {
            throw new Error("BOOKING_NOT_FOUND");
          }

          if (booking.paymentStatus === "PAID") {
            return;
          }

          const room = await tx.room.findUnique({ where: { id: booking.roomId } });
          if (!room) {
            throw new Error("ROOM_NOT_FOUND");
          }

          let newStatus: "CONFIRMED" | "WAITLISTED" = "CONFIRMED";
          let queuePosition: number | null = null;

          if (room.availableBeds > 0) {
            await tx.room.update({
              where: { id: room.id },
              data: { availableBeds: { decrement: 1 } },
            });
          } else {
            newStatus = "WAITLISTED";
            const waitlistCount = await tx.booking.count({
              where: {
                roomId: room.id,
                status: "WAITLISTED",
              },
            });
            queuePosition = waitlistCount + 1;
          }

          await tx.booking.update({
            where: { id: bookingId },
            data: {
              status: newStatus,
              paymentStatus: "PAID",
              stripePaymentIntentId: paymentIntentId ?? null,
              stripeChargeId: chargeId,
              receiptUrl,
              queuePosition,
            },
          });

          bookingEmailData = {
            userEmail: booking.user?.email ?? "",
            fullName: booking.user?.fullName ?? "",
            roomName: room.name,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            status: newStatus,
            queuePosition,
          };

          await logActivity(booking.userId, "STRIPE_PAYMENT_CONFIRMED", `Stripe payment confirmed for booking ${bookingId}. Allocated: ${newStatus}`);

          await createNotification({
            userId: booking.userId,
            type: newStatus === "CONFIRMED" ? "BOOKING_CONFIRMED" : "BOOKING_WAITLISTED",
            title: newStatus === "CONFIRMED" ? "Booking Confirmed" : "Placed on Waitlist",
            message:
              newStatus === "CONFIRMED"
                ? `Your payment was successful and your booking for room ${room.name} has been CONFIRMED.`
                : `Your payment was successful, but the room is fully booked. You are on the waiting list at position ${queuePosition}.`,
            data: { bookingId, roomId: room.id, queuePosition },
          });
        });

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata?.bookingId;
        if (bookingId && typeof bookingId === "string") {
          await prisma.booking.update({
            where: { id: bookingId },
            data: {
              paymentStatus: "FAILED",
            },
          });

          await logActivity(paymentIntent.metadata?.userId as string | undefined, "STRIPE_PAYMENT_FAILED", `Stripe payment failed for booking ${bookingId}`);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const booking = await prisma.booking.findFirst({
          where: { stripeChargeId: charge.id },
        });

        if (booking) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              paymentStatus: "REFUNDED",
            },
          });

          await logActivity(booking.userId, "STRIPE_REFUND", `Stripe refund processed for booking ${booking.id}`);
        }
        break;
      }

      default:
        break;
    }

    const emailData = bookingEmailData as BookingEmailData | null;
    if (emailData?.userEmail) {
      try {
        if (emailData.status === "CONFIRMED") {
          const emailContent = bookingConfirmationEmail(
            emailData.fullName,
            emailData.roomName,
            emailData.checkIn?.toDateString() ?? "",
            emailData.checkOut?.toDateString() ?? "",
          );
          await sendEmail(emailData.userEmail, emailContent.subject, emailContent);
        } else {
          const emailContent = bookingWaitlistEmail(
            emailData.fullName,
            emailData.roomName,
            emailData.queuePosition ?? 0,
            emailData.checkIn?.toDateString() ?? "",
            emailData.checkOut?.toDateString() ?? "",
          );
          await sendEmail(emailData.userEmail, emailContent.subject, emailContent);
        }
      } catch (mailError) {
        console.error("Failed to send booking status email:", mailError);
      }
    }

    return res.status(200).send({ received: true });
  } catch (error) {
    console.error("stripeWebhook error:", error);
    return res.status(500).send("Webhook handling failed");
  }
};
