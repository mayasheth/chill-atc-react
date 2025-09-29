import { useState } from "react";

export default function Contact() {
  const [status, setStatus] = useState<"idle"|"sending"|"ok"|"err">("idle");
  const [err, setErr] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending"); setErr("");
    const fd = new FormData(e.currentTarget);
    const payload = {
      name:   String(fd.get("name") || ""),
      email:  String(fd.get("email") || ""),
      message:String(fd.get("message") || ""),
      // honeypot anti-bot:
      website:String(fd.get("website") || ""),
    };
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(await r.text());
      setStatus("ok");
      e.currentTarget.reset();
    } catch (e:any) {
      setErr(e.message || "Failed to send");
      setStatus("err");
    }
  }

  return (
    <main className="mx-auto my-10 w-full max-w-screen-lg px-4">
      <h1 className="mb-6 text-2xl font-semibold text-content-0">Contact</h1>

      <form onSubmit={onSubmit} className="rounded-xl bg-surface-1 p-6">
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm text-content-2">Name</label>
            <input id="name" name="name" type="text" required
              className="mt-1 w-full rounded-md bg-surface-2 p-3 text-content-0 outline-none ring-1 ring-transparent focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm text-content-2">Email</label>
            <input id="email" name="email" type="email" required
              className="mt-1 w-full rounded-md bg-surface-2 p-3 text-content-0 outline-none ring-1 ring-transparent focus:ring-primary" />
          </div>
        </div>

        {/* honeypot (hidden) */}
        <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

        <div className="mb-4">
          <label htmlFor="message" className="block text-sm text-content-2">Message</label>
          <textarea id="message" name="message" required rows={6}
            className="mt-1 w-full rounded-md bg-surface-2 p-3 text-content-0 outline-none ring-1 ring-transparent focus:ring-primary" />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={status==="sending"}
            className="rounded-md bg-primary px-4 py-2 text-surface-1 hover:opacity-90 disabled:opacity-60"
          >
            {status==="sending" ? "Sending…" : "Send"}
          </button>
          {status==="ok"  && <span className="text-sm text-green-500">Sent. Thanks!</span>}
          {status==="err" && <span className="text-sm text-red-500">{err}</span>}
        </div>

        <p className="mt-4 text-sm text-content-2">
          Prefer email? <a className="underline underline-offset-4 hover:text-content-1" href="mailto:you@example.com">you@example.com</a>
        </p>
      </form>
    </main>
  );
}
