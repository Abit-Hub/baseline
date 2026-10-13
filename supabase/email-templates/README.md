# Email templates

Paste each file into Supabase under **Authentication → Emails → Templates**, with the subject shown.

| Template | File | Subject |
|---|---|---|
| Confirm signup | `confirm-signup.html` | Confirm your sign up |
| Reset password | `reset-password.html` | Reset your Baseline password |
| Change email | `change-email.html` | Confirm your new email |

Keep the `{{ .ConfirmationURL }}` and `{{ .Email }}` placeholders exactly as written. Supabase fills them in.

Leave the Invite user and Magic link templates alone. Baseline does not use them.
