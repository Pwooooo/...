export function ensureBlobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return process.env.BLOB_READ_WRITE_TOKEN;
  }

  // Check common alternate environment variable names on Vercel
  if (process.env.VERCEL_BLOB_READ_WRITE_TOKEN) {
    process.env.BLOB_READ_WRITE_TOKEN = process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
    return process.env.BLOB_READ_WRITE_TOKEN;
  }

  for (const [k, v] of Object.entries(process.env)) {
    if (
      (k.endsWith("_READ_WRITE_TOKEN") || k.includes("BLOB_READ_WRITE_TOKEN") || k.includes("BLOB_TOKEN")) &&
      typeof v === "string" &&
      v.startsWith("vercel_blob_rw_")
    ) {
      process.env.BLOB_READ_WRITE_TOKEN = v;
      return v;
    }
  }

  return undefined;
}

export function ensureBlobStoreId(): string | undefined {
  if (process.env.BLOB_STORE_ID) {
    return process.env.BLOB_STORE_ID;
  }

  for (const [k, v] of Object.entries(process.env)) {
    if (
      (k.endsWith("_STORE_ID") || k.includes("BLOB_STORE")) &&
      typeof v === "string" &&
      v.startsWith("store_")
    ) {
      process.env.BLOB_STORE_ID = v;
      return v;
    }
  }

  return undefined;
}
