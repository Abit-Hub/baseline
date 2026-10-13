/** The message a player sends their coach. WhatsApp is how most coaches will get it. */
export const inviteMessage = (link: string) =>
  `Coach, I'm keeping my training log on Baseline so we can both see my sessions and you can leave me notes. Join my log as my coach here: ${link}`

export const whatsappUrl = (link: string) => `https://wa.me/?text=${encodeURIComponent(inviteMessage(link))}`
