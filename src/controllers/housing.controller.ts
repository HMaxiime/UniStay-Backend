import type { Request, Response } from "express";

const notImplemented = (res: Response) =>
  res.status(501).json({ success: false, message: "Housing controller not implemented yet." });

export const getListings = async (_req: Request, res: Response) => notImplemented(res);
export const getListingById = async (_req: Request, res: Response) => notImplemented(res);
export const createListing = async (_req: Request, res: Response) => notImplemented(res);
export const updateListing = async (_req: Request, res: Response) => notImplemented(res);
export const deleteListing = async (_req: Request, res: Response) => notImplemented(res);
export const verifyListing = async (_req: Request, res: Response) => notImplemented(res);
export const getMyListings = async (_req: Request, res: Response) => notImplemented(res);
export const uploadHousingImages = async (_req: Request, res: Response) => notImplemented(res);
export const deleteHousingImage = async (_req: Request, res: Response) => notImplemented(res);
