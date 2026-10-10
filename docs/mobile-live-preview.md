# TotiChat Mobile Live Preview

This setup is for a **private development preview**, not a production deployment. It does not modify Supabase or Vercel.

## Open from an Android phone

1. Sign in to GitHub in Chrome.
2. Open [TotiChat Codespaces (mobile preview branch)](https://codespaces.new/jsjsnsnsnsn0-pixel/TotiChat/tree/setup/mobile-live-preview-20261010?quickstart=1).
3. Create or resume the Codespace. `npm ci` runs once during first setup.
4. In the VS Code terminal, run `npm run dev`.
5. The forwarded **port 3000** should open a **Simple Browser** preview. If it does not, go to **PORTS > 3000 > Preview in Editor**.
6. Use **Split Editor Right** to put source files on the left and the Simple Browser preview on the right. Landscape mode / Desktop site may help on mobile.
7. Save changes to see the Vite live update. Development-only changes stay in the Codespace until explicitly committed and pushed.

## Supabase setup (only if genuine backend functions are needed)

Copy `.env.example` to `.env.local`. Fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` with the **public client** values for the intended test project. Do **not** put `service_role`, API secrets, or private keys in `VITE_` variables. Do not commit `.env.local`.

Avoid mutating production user, wallet, agency or financial records when testing. Use an isolated test backend for write operations.

## Important limitations

- A Codespace reflects **unsaved edits only if they happen in that same Codespace**. Edits pushed to GitHub from elsewhere are not live keystrokes; they become visible after fetching/pulling the branch.
- The built-in browser is a dev preview and may need authentication for protected forwarded ports.
- Codespaces usage can be subject to monthly quotas / billing.
- A browser preview is not the same as testing a native Android APK or microphone/permissions on a real phone.
- The independent UI master is [QYEM7/TotiChatpro](https://github.com/QYEM7/TotiChatpro); it is not automatically synchronized with this application repository.
