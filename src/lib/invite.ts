/** The message a player sends their coach. WhatsApp is how most coaches will get it. */
export const inviteMessage = (link: string) =>
  `Coach, I'm keeping my training log on Baseline so we can both see my sessions and you can leave me notes. Join my log as my coach here: ${link}`

export const whatsappUrl = (link: string) => `https://wa.me/?text=${encodeURIComponent(inviteMessage(link))}`

/** What a coach sends a player who has not signed up yet. */
export const askPlayerMessage = (origin: string) =>
  `Hi, I'm using Baseline to follow your training, so we can both see your sessions and I can leave you notes. Sign up here: ${origin}/login?mode=up . Then open Settings, tap "Send on WhatsApp" and send me your coach link.`

export const whatsappTextUrl = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`
