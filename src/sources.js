/**
 * sources.js — Curated registry of 25+ high-signal AI/tech RSS feeds
 * Organized by primary domain with fallback to 'General' for multi-domain sources.
 */

const DOMAINS = {
  VIDEO_MEDIA: 'Video/Media',
  CODING_AGENTS: 'Coding/Agents',
  RESEARCH_ANALYTICS: 'Research/Analytics',
  ENTERPRISE_SECURITY: 'Enterprise/Security',
  GENERAL: 'General',
};

const SOURCES = [
  // ─── General AI Labs ────────────────────────────────────────────────────────
  {
    name: 'OpenAI Blog',
    url: 'https://openai.com/news/rss.xml',
    domain: DOMAINS.GENERAL,
    priority: 'HIGH',
    icon: '🧠',
  },
  {
    name: 'Anthropic News',
    url: 'https://www.anthropic.com/rss.xml',
    domain: DOMAINS.GENERAL,
    priority: 'HIGH',
    icon: '🧠',
  },
  {
    name: 'Google DeepMind Blog',
    url: 'https://deepmind.google/blog/rss.xml',
    domain: DOMAINS.GENERAL,
    priority: 'HIGH',
    icon: '🧠',
  },
  {
    name: 'Hugging Face Blog',
    url: 'https://huggingface.co/blog/feed.xml',
    domain: DOMAINS.GENERAL,
    priority: 'HIGH',
    icon: '🤗',
  },
  {
    name: 'The Verge – AI',
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    domain: DOMAINS.GENERAL,
    priority: 'MEDIUM',
    icon: '📰',
  },
  {
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    domain: DOMAINS.GENERAL,
    priority: 'MEDIUM',
    icon: '📰',
  },
  {
    name: 'VentureBeat AI',
    url: 'https://venturebeat.com/category/ai/feed/',
    domain: DOMAINS.GENERAL,
    priority: 'MEDIUM',
    icon: '📰',
  },
  {
    name: 'MarkTechPost',
    url: 'https://www.marktechpost.com/feed/',
    domain: DOMAINS.GENERAL,
    priority: 'MEDIUM',
    icon: '📰',
  },
  {
    name: 'MIT Technology Review – AI',
    url: 'https://www.technologyreview.com/feed/',
    domain: DOMAINS.GENERAL,
    priority: 'MEDIUM',
    icon: '🎓',
  },

  // ─── Video / Media ──────────────────────────────────────────────────────────
  {
    name: 'Runway ML Blog',
    url: 'https://runwayml.com/blog/feed/',
    domain: DOMAINS.VIDEO_MEDIA,
    priority: 'HIGH',
    icon: '🎬',
  },
  {
    name: 'ElevenLabs Blog',
    url: 'https://elevenlabs.io/blog/rss',
    domain: DOMAINS.VIDEO_MEDIA,
    priority: 'HIGH',
    icon: '🎙️',
  },
  {
    name: 'Stability AI Blog',
    url: 'https://stability.ai/blog/rss.xml',
    domain: DOMAINS.VIDEO_MEDIA,
    priority: 'MEDIUM',
    icon: '🎨',
  },

  // ─── Coding / Agents ────────────────────────────────────────────────────────
  {
    name: 'GitHub Blog',
    url: 'https://github.blog/feed/',
    domain: DOMAINS.CODING_AGENTS,
    priority: 'HIGH',
    icon: '💻',
  },
  {
    name: 'LangChain Blog',
    url: 'https://blog.langchain.dev/rss/',
    domain: DOMAINS.CODING_AGENTS,
    priority: 'HIGH',
    icon: '🔗',
  },
  {
    name: "Simon Willison's Weblog",
    url: 'https://simonwillison.net/atom/everything/',
    domain: DOMAINS.CODING_AGENTS,
    priority: 'HIGH',
    icon: '🧑‍💻',
  },
  {
    name: 'Towards Data Science',
    url: 'https://towardsdatascience.com/feed',
    domain: DOMAINS.CODING_AGENTS,
    priority: 'MEDIUM',
    icon: '📊',
  },
  {
    name: 'The Pragmatic Engineer',
    url: 'https://newsletter.pragmaticengineer.com/feed',
    domain: DOMAINS.CODING_AGENTS,
    priority: 'MEDIUM',
    icon: '⚙️',
  },

  // ─── Research / Analytics ───────────────────────────────────────────────────
  {
    name: 'arXiv – Artificial Intelligence (cs.AI)',
    url: 'https://rss.arxiv.org/rss/cs.AI',
    domain: DOMAINS.RESEARCH_ANALYTICS,
    priority: 'HIGH',
    icon: '📄',
  },
  {
    name: 'arXiv – Machine Learning (cs.LG)',
    url: 'https://rss.arxiv.org/rss/cs.LG',
    domain: DOMAINS.RESEARCH_ANALYTICS,
    priority: 'HIGH',
    icon: '📄',
  },
  {
    name: 'Weights & Biases Blog',
    url: 'https://wandb.ai/fully-connected/rss',
    domain: DOMAINS.RESEARCH_ANALYTICS,
    priority: 'MEDIUM',
    icon: '📈',
  },
  {
    name: 'Berkeley AI Research (BAIR)',
    url: 'https://bair.berkeley.edu/blog/feed.xml',
    domain: DOMAINS.RESEARCH_ANALYTICS,
    priority: 'MEDIUM',
    icon: '🎓',
  },
  {
    name: 'MIT News – Artificial Intelligence',
    url: 'https://news.mit.edu/rss/topic/artificial-intelligence',
    domain: DOMAINS.RESEARCH_ANALYTICS,
    priority: 'MEDIUM',
    icon: '🎓',
  },

  // ─── Enterprise / Security ──────────────────────────────────────────────────
  {
    name: 'AWS Machine Learning Blog',
    url: 'https://aws.amazon.com/blogs/machine-learning/feed/',
    domain: DOMAINS.ENTERPRISE_SECURITY,
    priority: 'HIGH',
    icon: '☁️',
  },
  {
    name: 'Microsoft Azure AI Blog',
    url: 'https://techcommunity.microsoft.com/gxcuf89792/rss/board?board.id=AI',
    domain: DOMAINS.ENTERPRISE_SECURITY,
    priority: 'HIGH',
    icon: '🪟',
  },
  {
    name: 'Google Cloud AI Blog',
    url: 'https://cloud.google.com/feeds/gcp-blog.xml',
    domain: DOMAINS.ENTERPRISE_SECURITY,
    priority: 'MEDIUM',
    icon: '☁️',
  },
  {
    name: 'NIST AI',
    url: 'https://www.nist.gov/blogs/feed',
    domain: DOMAINS.ENTERPRISE_SECURITY,
    priority: 'MEDIUM',
    icon: '🔐',
  },
];

// Domain display config
const DOMAIN_CONFIG = {
  [DOMAINS.VIDEO_MEDIA]: {
    emoji: '🎬',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    bgColor: 'rgba(168, 85, 247, 0.1)',
    borderColor: 'rgba(168, 85, 247, 0.3)',
    keywords: [
      'video', 'image', 'audio', 'voice', 'music', 'media', 'generation',
      'text-to-video', 'text-to-image', 'diffusion', 'stable diffusion',
      'sora', 'runway', 'pika', 'kling', 'elevenlabs', 'suno', 'udio',
      'midjourney', 'dalle', 'flux', 'creative', 'animation', 'visual',
      'speech synthesis', 'tts', 'art',
    ],
  },
  [DOMAINS.CODING_AGENTS]: {
    emoji: '🤖',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    keywords: [
      'code', 'coding', 'developer', 'github', 'copilot', 'agent', 'agentic',
      'cursor', 'devin', 'cline', 'ide', 'llm', 'framework', 'sdk', 'api',
      'langchain', 'langgraph', 'autogen', 'crewai', 'tool use', 'function calling',
      'rag', 'retrieval', 'embedding', 'vector', 'open source', 'plugin',
      'cli', 'terminal', 'devops', 'programming',
    ],
  },
  [DOMAINS.RESEARCH_ANALYTICS]: {
    emoji: '📊',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    keywords: [
      'paper', 'research', 'study', 'benchmark', 'dataset', 'evaluation',
      'arxiv', 'model', 'training', 'fine-tuning', 'finetune', 'mlops',
      'analytics', 'data science', 'experiment', 'results', 'performance',
      'accuracy', 'scaling', 'inference', 'transformer', 'attention',
      'multimodal', 'foundation model', 'pretraining',
    ],
  },
  [DOMAINS.ENTERPRISE_SECURITY]: {
    emoji: '🔐',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    keywords: [
      'enterprise', 'security', 'compliance', 'governance', 'safety',
      'aws', 'azure', 'google cloud', 'gcp', 'privacy', 'gdpr', 'regulation',
      'risk', 'audit', 'soc2', 'iso', 'responsible ai', 'ai safety',
      'red team', 'vulnerability', 'deployment', 'production', 'b2b',
      'saas', 'platform', 'integration', 'workflow', 'automation',
    ],
  },
  [DOMAINS.GENERAL]: {
    emoji: '🌐',
    color: '#6b7280',
    gradient: 'linear-gradient(135deg, #6b7280 0%, #374151 100%)',
    bgColor: 'rgba(107, 114, 128, 0.1)',
    borderColor: 'rgba(107, 114, 128, 0.3)',
    keywords: [],
  },
};

module.exports = { SOURCES, DOMAINS, DOMAIN_CONFIG };
