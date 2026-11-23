package com.tactai.guardian

data class ServiceIntegration(
    val name: String,
    val group: String,
    val purpose: String,
    val setup: String,
    val portalUrl: String? = null
)

/**
 * Known services in the user's workflow. Listing a service does not mean an
 * account is connected; credentials and OAuth grants are configured separately.
 */
object IntegrationCatalog {
    val services = listOf(
        ServiceIntegration("Gemini", "AI assistants", "General AI assistant and research.", "Official sign-in or supported API setup.", "https://gemini.google.com/"),
        ServiceIntegration("Google AI Studio", "AI development", "Prototype and manage Gemini API projects.", "Create a project/API key; store the key server-side only.", "https://aistudio.google.com/"),
        ServiceIntegration("ChatGPT", "AI assistants", "Planning, writing and general AI assistance.", "Official sign-in; API access is a separate OpenAI Platform setup.", "https://chatgpt.com/"),
        ServiceIntegration("OpenAI Platform", "AI development", "API projects, model access and usage controls.", "Create a project key and store it in gateway secrets.", "https://platform.openai.com/"),
        ServiceIntegration("Claude", "AI assistants", "Reasoning, writing and code review.", "Official sign-in or Anthropic API key stored server-side.", "https://claude.ai/"),
        ServiceIntegration("Grok", "AI assistants", "AI assistant and X ecosystem research.", "Official sign-in; API access must be configured separately.", "https://grok.com/"),
        ServiceIntegration("Genspark", "AI research", "Research and multi-step knowledge workflows.", "Check account/API availability before enabling automation.", "https://www.genspark.ai/"),
        ServiceIntegration("Manus", "AI agents", "Agent-based research and task workflows.", "Check supported account/API integration before enabling actions.", "https://manus.im/"),
        ServiceIntegration("X Ads", "Advertising", "Campaign planning and advertising account workflows.", "Official account authorization and Ads API access required.", "https://ads.x.com/"),
        ServiceIntegration("AdsGPT", "Advertising", "Your separate AdsGPT advertising workflow.", "Add its confirmed app URL/API endpoint before connecting."),
        ServiceIntegration("GitHub", "Build and publish", "Repository, branches, commits and CI build status.", "GitHub authorization with repository-scoped permissions.", "https://github.com/Chrisjames378/tact-ai"),
        ServiceIntegration("Vercel", "Build and publish", "Preview and production deployment status.", "Vercel authorization; deployments require explicit approval.", "https://vercel.com/")
    )
}
