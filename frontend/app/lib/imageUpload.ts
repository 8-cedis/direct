export async function uploadImage(file: File) {
  const form = new FormData();
  form.append("image", file);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const res = await fetch(`${apiBase}/api/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }

  return res.json(); // { url, filename }
}
