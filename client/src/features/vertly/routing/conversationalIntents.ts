import { normalizeVertlyMessage } from "@/features/vertly/routing/normalizeVertlyMessage"
import type {
  VertlyConversationRequest,
  VertlyConversationResponse,
  VertlySuggestion,
} from "@/features/vertly/types"

type ConversationalIntent = {
  id: string
  /** Exact normalized phrases (after normalizeVertlyMessage). */
  exact?: string[]
  /** Regex patterns tested against the normalized message. */
  patterns?: RegExp[]
  /**
   * When true, skip this intent if the page has live audit context so existing
   * audit/report handlers keep answering with real report data.
   */
  deferWhenAuditContext?: boolean
  response: VertlyConversationResponse
}

const DEFAULT_SUGGESTIONS: VertlySuggestion[] = [
  { id: "ci-audits", label: "How audits work", prompt: "How do Convertly audits work?" },
  { id: "ci-help", label: "What can you do?", prompt: "What can you do?" },
  { id: "ci-report", label: "Explain this report", prompt: "Explain this report" },
]

function reply(content: string, suggestions: VertlySuggestion[] = DEFAULT_SUGGESTIONS): VertlyConversationResponse {
  return { content, suggestions }
}

/**
 * Lightweight conversational intents answered with predefined copy.
 * Checked before existing Vertly audit/product routing — does not call AI.
 */
const CONVERSATIONAL_INTENTS: ConversationalIntent[] = [
  {
    id: "greeting",
    exact: [
      "hi",
      "hello",
      "hey",
      "yo",
      "sup",
      "howdy",
      "greetings",
      "good morning",
      "good afternoon",
      "good evening",
      "hiya",
      "hi there",
      "hello there",
      "hey there",
    ],
    patterns: [/^(hi|hello|hey|yo|sup|howdy)\b/, /^good (morning|afternoon|evening)\b/],
    response: reply(
      "Hey — good to see you. I'm **Vertly**, Convertly's AI Product Specialist.\n\n" +
        "Ask me about audits, reports, your plan, billing, or workspace."
    ),
  },
  {
    id: "how-are-you",
    exact: ["how are you", "how's it going", "hows it going", "how are you doing", "how you doing"],
    patterns: [/^how('?s| is)? (it going|everything|things)\b/, /^you (ok|okay|good)\b/],
    response: reply(
      "I'm doing well — ready to help you make sense of Convertly.\n\n" +
        "What would you like to look at?"
    ),
  },
  {
    id: "thanks",
    exact: ["thanks", "thank you", "thx", "ty", "thank you so much", "thanks a lot", "appreciate it"],
    patterns: [/^thanks?\b/, /^thank you\b/, /^appreciate (it|that)\b/],
    response: reply("You're welcome. Happy to help whenever you need another look at Convertly."),
  },
  {
    id: "bye",
    exact: ["bye", "goodbye", "good bye", "see you", "see ya", "later", "catch you later", "take care"],
    patterns: [/^(bye|goodbye|good bye|see you|see ya|later)\b/],
    response: reply("Take care — I'll be here when you're ready to continue."),
  },
  {
    id: "who-are-you",
    exact: [
      "who are you",
      "what are you",
      "who is vertly",
      "what is vertly",
      "tell me about yourself",
      "what is your job",
      "what do you do",
    ],
    patterns: [/\bwho (are|is) (you|vertly)\b/, /\bwhat (are|is) (you|vertly)\b/, /\btell me about yourself\b/],
    response: reply(
      "I'm **Vertly**, Convertly's AI Product Specialist.\n\n" +
        "I help you understand audits, reports, dashboards, billing, workspaces, and how to improve your website with Convertly.\n\n" +
        "I'm focused on Convertly — not a general-purpose chatbot."
    ),
  },
  {
    id: "what-can-you-do",
    exact: ["what can you do", "what can you help with", "how can you help", "what do you help with"],
    patterns: [/\bwhat can you (do|help)\b/, /\bhow can you help\b/, /\byour (capabilities|features)\b/],
    response: reply(
      "I can help with:\n\n" +
        "- Explaining Convertly audits, scores, and findings\n" +
        "- Walking through reports and recommendations\n" +
        "- Clarifying confidence, Growth Score, and priorities\n" +
        "- Answering questions about plans, billing, and workspace\n" +
        "- Pointing you to what to fix first\n\n" +
        "Ask anything Convertly-related and I'll keep it practical."
    ),
  },
  {
    id: "help",
    exact: ["help", "help me", "i need help", "can you help", "need help"],
    patterns: [/^help\b/, /\b(need|want) help\b/, /^can you help\b/],
    response: reply(
      "Absolutely. Tell me what you need — an audit explanation, score clarification, plan question, or a quick Convertly overview."
    ),
  },
  {
    id: "what-is-convertly",
    exact: ["what is convertly", "whats convertly", "tell me about convertly", "explain convertly"],
    patterns: [/\bwhat('?s| is) convertly\b/, /\btell me about convertly\b/, /\bexplain convertly\b/],
    response: reply(
      "**Convertly** is an AI conversion intelligence platform.\n\n" +
        "It audits public website pages, scores conversion readiness, and surfaces prioritized fixes so you know what to improve first."
    ),
  },
  {
    id: "who-made-you",
    exact: ["who made you", "who built you", "who created you", "who developed you"],
    patterns: [/\bwho (made|built|created|developed) (you|vertly)\b/],
    response: reply(
      "I was built as part of **Convertly** — the product team behind Convertly created me to guide users through audits and reports."
    ),
  },
  {
    id: "explain-report",
    exact: ["explain this report", "explain the report", "what does this report mean", "help me understand this report"],
    patterns: [/\bexplain (this|the|my) report\b/, /\bunderstand (this|the) report\b/],
    deferWhenAuditContext: true,
    response: reply(
      "A Convertly report summarizes conversion health for the pages we analyzed.\n\n" +
        "You'll typically see an overall Growth Score, category breakdowns, prioritized findings, and recommended next steps.\n\n" +
        "Open a report and ask again — I'll explain the actual numbers for that audit."
    ),
  },
  {
    id: "explain-score",
    exact: ["explain this score", "explain the score", "what does this score mean", "explain my score"],
    patterns: [/\bexplain (this|the|my) score\b/, /\bwhat does (this|the|my) score mean\b/],
    deferWhenAuditContext: true,
    response: reply(
      "Your **Growth Score** reflects conversion readiness based on findings across the audited pages.\n\n" +
        "Higher is better. Category scores (Growth, Conversion, Trust, Mobile, UX) show where strength and risk sit.\n\n" +
        "Open an audit report and ask again for a score-specific explanation."
    ),
  },
  {
    id: "what-is-confidence",
    exact: ["what is confidence", "whats confidence", "explain confidence", "what does confidence mean"],
    patterns: [/\bwhat('?s| is) confidence\b/, /\bexplain confidence\b/, /\bconfidence (score|level|mean)\b/],
    response: reply(
      "**Confidence** reflects how reliable the audit signals are for that run — based on crawl coverage, data completeness, and related diagnostics.\n\n" +
        "- **High** — strong evidence base\n" +
        "- **Medium** — useful, with some limits\n" +
        "- **Low** — treat findings more carefully\n\n" +
        "It does not replace the Growth Score; it tells you how much to trust the evidence behind it."
    ),
  },
  {
    id: "what-is-accessibility",
    exact: ["what is accessibility", "whats accessibility", "explain accessibility"],
    patterns: [/\bwhat('?s| is) accessibility\b/, /\bexplain accessibility\b/],
    response: reply(
      "**Accessibility** is about whether people can use your site effectively — including keyboard navigation, contrast, readable targets, and clear content.\n\n" +
        "In Convertly, accessibility-related issues often show up under UX or Mobile findings and can hurt trust and conversion."
    ),
  },
  {
    id: "what-is-seo",
    exact: ["what is seo", "whats seo", "explain seo"],
    patterns: [/\bwhat('?s| is) seo\b/, /\bexplain seo\b/],
    response: reply(
      "**SEO** (Search Engine Optimization) helps people discover your site through search.\n\n" +
        "Convertly focuses more on conversion intelligence after someone arrives — but weak structure, unclear pages, or missing trust signals can still hurt both SEO and conversion."
    ),
  },
  {
    id: "what-is-ux",
    exact: ["what is ux", "whats ux", "explain ux", "what is user experience"],
    patterns: [/\bwhat('?s| is) (ux|user experience)\b/, /\bexplain (ux|user experience)\b/],
    response: reply(
      "**UX (User Experience)** is how easy and pleasant your site feels to use.\n\n" +
        "Clear navigation, readable CTAs, mobile usability, and low friction all improve UX — and usually conversion too."
    ),
  },
  {
    id: "what-is-conversion",
    exact: [
      "what is conversion",
      "what is conversion optimization",
      "whats conversion optimization",
      "explain conversion optimization",
      "what is cro",
    ],
    patterns: [
      /\bwhat('?s| is) conversion( optimization)?\b/,
      /\bexplain conversion( optimization)?\b/,
      /\bwhat('?s| is) cro\b/,
    ],
    response: reply(
      "**Conversion optimization** improves the likelihood that visitors take a desired action — inquire, book, buy, or sign up.\n\n" +
        "Convertly audits for friction, trust gaps, weak CTAs, and other conversion blockers, then prioritizes fixes."
    ),
  },
  {
    id: "why-important",
    exact: ["why is this important", "why does this matter", "why is this useful"],
    patterns: [/\bwhy (is|does) (this|it) (important|matter|useful)\b/],
    deferWhenAuditContext: true,
    response: reply(
      "Because small conversion issues compound — unclear CTAs, weak trust, or mobile friction quietly reduce leads and revenue.\n\n" +
        "Convertly helps you see the highest-impact problems first so effort goes where it matters."
    ),
  },
  {
    id: "simplify",
    exact: ["can you simplify this", "simplify this", "explain simply", "in simple terms", "eli5"],
    patterns: [/\bsimplify (this|it)\b/, /\bin simple terms\b/, /\bexplain (this |it )?(simply|simply please)\b/],
    deferWhenAuditContext: true,
    response: reply(
      "Sure — keep it simple:\n\n" +
        "1. Convertly scans your site for conversion problems.\n" +
        "2. It scores how ready your site is to convert.\n" +
        "3. It lists the most important fixes first.\n\n" +
        "If you open a report, ask again and I'll simplify that specific audit."
    ),
  },
  {
    id: "fix-first",
    exact: [
      "what should i fix first",
      "what to fix first",
      "where should i start",
      "what first",
      "prioritize for me",
    ],
    patterns: [
      /\bwhat should i fix first\b/,
      /\bwhat (to|do i) fix first\b/,
      /\bwhere should i start\b/,
      /\b(top|first) (priority|priorities|fix)\b/,
    ],
    deferWhenAuditContext: true,
    response: reply(
      "Start with **critical and high-severity** findings that block trust or action — missing contact paths, weak CTAs, broken flows, and major mobile issues.\n\n" +
        "Open an audit report and ask again; I'll prioritize from that report's real findings."
    ),
  },
  {
    id: "growth-score",
    exact: ["what is growth score", "whats growth score", "explain growth score"],
    patterns: [/\bwhat('?s| is) (the )?growth score\b/, /\bexplain (the )?growth score\b/],
    response: reply(
      "**Growth Score** is Convertly's overall conversion-readiness score for an audit.\n\n" +
        "It rolls up category performance and findings into one number you can track over time."
    ),
  },
  {
    id: "findings",
    exact: ["what are findings", "what is a finding", "explain findings"],
    patterns: [/\bwhat (are|is) (a )?findings?\b/, /\bexplain findings\b/],
    response: reply(
      "**Findings** are specific issues Convertly detected on your site — like missing trust links, weak CTAs, or mobile friction.\n\n" +
        "Each finding usually includes severity, impact, and where it appeared."
    ),
  },
  {
    id: "recommendations",
    exact: ["what are recommendations", "explain recommendations", "what is a recommendation"],
    patterns: [/\bwhat (are|is) (a )?recommendations?\b/, /\bexplain recommendations\b/],
    response: reply(
      "**Recommendations** are actionable next steps based on findings.\n\n" +
        "They are ordered for triage so you can improve conversion without guessing where to start."
    ),
  },
  {
    id: "ok",
    exact: ["ok", "okay", "cool", "got it", "alright", "sounds good", "perfect", "great"],
    response: reply("Great. What else would you like to explore?"),
  },
  {
    id: "yes",
    exact: ["yes", "yeah", "yep", "sure", "please"],
    response: reply("Sounds good — tell me the next question, or pick a suggestion below."),
  },
  {
    id: "no",
    exact: ["no", "nope", "not really", "nah"],
    response: reply("No problem. If you want help later with audits, scores, or Convertly basics, just ask."),
  },
  {
    id: "joke",
    exact: ["tell me a joke", "make me laugh"],
    patterns: [/\btell me a joke\b/],
    response: reply(
      "I keep the humor light — my specialty is conversion clarity, not stand-up.\n\n" +
        "Want a quick Convertly tip instead?"
    ),
  },
  {
    id: "are-you-ai",
    exact: ["are you ai", "are you an ai", "are you a bot", "are you a robot", "are you human"],
    patterns: [/\bare you (an? )?(ai|bot|robot|human)\b/],
    response: reply(
      "I'm Vertly — Convertly's product assistant. I answer with Convertly product knowledge and your report context when available."
    ),
  },
  {
    id: "language",
    exact: ["do you speak english", "what languages do you speak"],
    patterns: [/\b(speak|support).*(english|language)/, /\bwhat languages?\b/],
    response: reply("I communicate in English and focus on clear, practical Convertly guidance."),
  },
  {
    id: "privacy",
    exact: ["are you private", "is this private", "do you store chats"],
    patterns: [/\b(is this|are you) private\b/, /\bdo you (store|save|keep) (chats?|conversations?|messages?)\b/],
    response: reply(
      "If you're signed in, your Vertly conversation is saved to your Convertly account and only visible to you.\n\n" +
        "If you're browsing as a guest, the chat stays in this page session only and clears when you refresh or close the tab."
    ),
  },
  {
    id: "login-help",
    exact: ["how do i login", "how do i sign in", "how to login", "how to sign in"],
    patterns: [/\bhow (do i |to )?(log ?in|sign in)\b/],
    response: reply(
      "Use the **Log in** page with your Convertly email and password.\n\n" +
        "If you forgot your password, use **Forgot password** to reset it."
    ),
  },
  {
    id: "signup-help",
    exact: ["how do i signup", "how do i sign up", "how to create an account", "how to register"],
    patterns: [/\bhow (do i |to )?(sign ?up|create an account|register)\b/],
    response: reply(
      "Open **Sign up**, create your Convertly account, then you can run audits and keep Vertly history across sessions."
    ),
  },
  {
    id: "sample-report",
    exact: ["what is the sample report", "explain sample report", "show me a sample"],
    patterns: [/\bsample report\b/, /\bexample (audit )?report\b/],
    response: reply(
      "The **sample report** is a walkthrough of Convertly's audit output — scores, findings, and recommendations — so you can see the product before running your own audit."
    ),
  },
  {
    id: "mobile",
    exact: ["what is mobile score", "explain mobile", "what is mobile"],
    patterns: [/\bwhat('?s| is) mobile( score)?\b/, /\bexplain mobile( score)?\b/],
    response: reply(
      "**Mobile** looks at how usable your site is on smaller screens — touch targets, layout, and mobile friction that can block conversion."
    ),
  },
  {
    id: "trust",
    exact: ["what is trust", "what is trust score", "explain trust"],
    patterns: [/\bwhat('?s| is) trust( score)?\b/, /\bexplain trust( score)?\b/],
    response: reply(
      "**Trust** covers credibility signals visitors look for — contact paths, legal links, clarity, and other reassurance cues that support conversion."
    ),
  },
  {
    id: "nice-to-meet",
    exact: ["nice to meet you", "pleased to meet you"],
    patterns: [/\bnice to meet you\b/],
    response: reply("Nice to meet you too. I'm Vertly — ready whenever you want to dig into Convertly."),
  },
  {
    id: "good-night",
    exact: ["good night", "goodnight"],
    response: reply("Good night. I'll be here next time you open Convertly."),
  },
  {
    id: "weather",
    exact: ["how is the weather", "whats the weather"],
    patterns: [/\bweather\b/],
    response: reply(
      "I'm focused on Convertly, not weather forecasts.\n\n" +
        "Ask me about audits, scores, findings, or how Convertly works."
    ),
  },
  {
    id: "name",
    exact: ["whats your name", "what is your name", "do you have a name"],
    patterns: [/\bwhat('?s| is) your name\b/, /\bdo you have a name\b/],
    response: reply("I'm **Vertly** — Convertly's AI Product Specialist."),
  },
  {
    id: "bored",
    exact: ["im bored", "i am bored", "this is boring"],
    patterns: [/\b(i'?m|i am) bored\b/, /\bthis is boring\b/],
    response: reply(
      "Let's make it useful — ask me to explain Convertly, a Growth Score, confidence, or what to fix first on a report."
    ),
  },
  {
    id: "love",
    exact: ["i love you", "love you"],
    patterns: [/\bi love you\b/, /^love you$/],
    response: reply("Appreciate the kindness. Let's put that energy into improving conversion with Convertly."),
  },
  {
    id: "sorry",
    exact: ["sorry", "my bad", "apologies"],
    patterns: [/^sorry\b/, /^my bad\b/, /^apologies\b/],
    response: reply("No worries at all. What would you like help with next?"),
  },
  {
    id: "wait",
    exact: ["wait", "one sec", "hold on", "give me a minute"],
    patterns: [/^wait\b/, /^hold on\b/, /^one (sec|second|moment)\b/],
    response: reply("Take your time — I'm here when you're ready."),
  },
  {
    id: "test",
    exact: ["test", "testing", "hello world"],
    response: reply("Connected and ready. Ask me anything about Convertly, audits, or your report."),
  },
]

function matchesIntent(normalized: string, intent: ConversationalIntent): boolean {
  if (intent.exact?.some((phrase) => phrase === normalized)) return true
  if (intent.patterns?.some((pattern) => pattern.test(normalized))) return true
  return false
}

/**
 * Match common conversational messages to predefined responses.
 * Returns null when the message should continue through existing Vertly routing.
 */
export function matchConversationalIntent(
  request: VertlyConversationRequest
): VertlyConversationResponse | null {
  const normalized = normalizeVertlyMessage(request.message)
  if (!normalized) return null

  const hasAuditContext = Boolean(request.context.auditContext)

  for (const intent of CONVERSATIONAL_INTENTS) {
    if (intent.deferWhenAuditContext && hasAuditContext) continue
    if (!matchesIntent(normalized, intent)) continue
    return intent.response
  }

  return null
}

export function isConversationalIntentMessage(message: string): boolean {
  const normalized = normalizeVertlyMessage(message)
  if (!normalized) return false
  return CONVERSATIONAL_INTENTS.some((intent) => matchesIntent(normalized, intent))
}
