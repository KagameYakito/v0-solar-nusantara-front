-- Migration: Add image columns to auction_history table
-- Run this in the Supabase SQL Editor to fix missing images on the Lelang (Auction) page.
--
-- Problem: When an auction ends, the product card image disappears because
-- auction_history did not store image URLs. If the same product is re-auctioned
-- with new images, the old auction history cards have no images to display.
--
-- Solution: Store image URLs in auction_history at the time the auction ends,
-- so they are preserved permanently regardless of future product changes.

ALTER TABLE auction_history
  ADD COLUMN IF NOT EXISTS gambar_url TEXT,
  ADD COLUMN IF NOT EXISTS auction_gallery_urls TEXT[],
  ADD COLUMN IF NOT EXISTS auction_description TEXT;

-- Backfill existing history rows with current product image data
-- (best-effort: only works if the product images haven't been replaced yet)
UPDATE auction_history h
SET
  gambar_url          = p.gambar_url,
  auction_gallery_urls = p.auction_gallery_urls,
  auction_description  = p.auction_description
FROM products p
WHERE h.product_id = p.id
  AND h.gambar_url IS NULL
  AND h.auction_gallery_urls IS NULL;
