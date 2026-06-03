import { prisma } from "../lib/prisma.js";
import Stripe from "stripe";
import stripe from "../config/stripe.js";
import type { Request, Response } from "express";

// Helper to log audit actions
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
    console.error("Failed to log activity:", err);
  }
};

// ─── CREATE REFUND REQUEST ───────────────────────────────────────────────────
export const createRefundRequest = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { bookingId, reason } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!bookingId) {
      return res.status(400).json({ success: false, message: "bookingId is required" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.userId !== userId && req.user?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
    }

    if (booking.status !== "CANCELLED") {
      return res.status(400).json({ success: false, message: "Refunds can only be requested for cancelled bookings" });
    }

    if (booking.paymentStatus !== "PAID") {
      return res.status(400).json({ success: false, message: "No payments found to refund for this booking" });
    }

    const existingRequest = await prisma.refundRequest.findUnique({
      where: { bookingId },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "A refund request already exists for this booking",
        data: existingRequest,
      });
    }

    const refund = await prisma.refundRequest.create({
      data: {
        bookingId,
        amount: booking.totalAmount || 0,
        status: "PENDING",
        reason: reason ,
      },
    });

    await logActivity(userId, "REFUND_REQUESTED", `Requested refund of ${refund.amount} for booking ${bookingId}`);

    return res.status(201).json({
      success: true,
      message: "Refund request submitted successfully and is pending admin review.",
      data: refund,
    });
  } catch (error) {
    console.error("createRefundRequest error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── GET REFUND REQUESTS (Admin only) ─────────────────────────────────────────
export const getRefundRequests = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const { status, page = "1", limit = "10" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filters: any = {};

    if (status) {
      filters.status = String(status);
    }

    const [refunds, total] = await Promise.all([
      prisma.refundRequest.findMany({
        where: filters,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          booking: {
            include: {
              user: { select: { id: true, fullName: true, email: true } },
              room: { select: { id: true, name: true, hostel: { select: { name: true } } } },
            },
          },
        },
      }),
      prisma.refundRequest.count({ where: filters }),
    ]);

    return res.status(200).json({
      success: true,
      data: refunds,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("getRefundRequests error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── PROCESS REFUND REQUEST (Admin only) ──────────────────────────────────────
export const processRefundRequest = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const { status } = req.body; // APPROVED or REJECTED
    const adminId = req.user?.id;

    if (!id) {
      return res.status(400).json({ success: false, message: "Refund request ID is required" });
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ success: false, message: "status must be APPROVED or REJECTED" });
    }

    const refund = await prisma.refundRequest.findUnique({
      where: { id },
      include: { booking: true },
    });

    if (!refund) {
      return res.status(404).json({ success: false, message: "Refund request not found" });
    }

    if (refund.status !== "PENDING") {
      return res.status(400).json({ success: false, message: `Refund request is already processed: ${refund.status}` });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedRefund = await tx.refundRequest.update({
        where: { id },
        data: { status },
      });

      if (status === "APPROVED") {
        if (!refund.booking.stripePaymentIntentId && !refund.booking.stripeChargeId) {
          throw new Error("STRIPE_PAYMENT_METADATA_MISSING");
        }

        const refundParams: Stripe.RefundCreateParams = {
          metadata: {
            bookingId: refund.bookingId,
            refundRequestId: id,
          },
        };

        if (refund.booking.stripePaymentIntentId) {
          refundParams.payment_intent = refund.booking.stripePaymentIntentId;
        }

        if (refund.booking.stripeChargeId) {
          refundParams.charge = refund.booking.stripeChargeId;
        }

        await stripe.refunds.create(refundParams);

        await tx.booking.update({
          where: { id: refund.bookingId },
          data: { paymentStatus: "REFUNDED" },
        });
      }

      return updatedRefund;
    });

    await logActivity(adminId, "REFUND_PROCESSED", `Refund request ${id} processed to ${status}`);

    return res.status(200).json({
      success: true,
      message: `Refund request ${status.toLowerCase()} successfully`,
      data: result,
    });
  } catch (error) {
    console.error("processRefundRequest error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
