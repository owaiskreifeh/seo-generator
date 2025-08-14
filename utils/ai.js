const {GoogleGenAI} = require("@google/genai");

const ENHANCE_DESCRIPTION_PROMPT = `
Enhance the following description to be more engaging, specific, and SEO-friendly for use in meta tags, Open Graph tags, Twitter Cards, and structured data.

IMPORTANT: Output only the enhanced description text. No explanations, formatting, quotes, or additional text.

Description to enhance: _DESCRIPTION_
`;

const GENERATE_EXTRA_FIELDS_PROMPT = `
Generate extra fields for a website based on the provided information. Create site slang, relevant keywords, and an image subtitle for social media.

Site URL: _SITE_URL_
Site Title: _SITE_TITLE_
Site Description: _SITE_DESCRIPTION_

IMPORTANT: Output only valid JSON in the exact format below. No explanations, markdown formatting, code blocks, or additional text.

{
    "siteSlang": "string",
    "keywords": "string",
    "imageSubtitle": "string"
}
`;

class AI {
    constructor() {
        this.model = "gemini-2.5-flash";
        this.thinkingBudget = 0;
        console.log("process.env.GEMINI_API_KEY", process.env.GEMINI_API_KEY);
        this.ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        });
    }

    async callAi(prompt) {
        const response = await this.ai.models.generateContent({
            model: this.model,
            contents: prompt,
            config: {
                thinkingConfig: {
                    thinkingBudget: this.thinkingBudget,
                },
            },
        });
        return response.text;
    }

    enhanceDescription(description) {
        const prompt = ENHANCE_DESCRIPTION_PROMPT.replace("_DESCRIPTION_", description);
        return this.callAi(prompt);
    };

    /**
     * it will take site info and generate site slang, keywords, and other relevant information
     * and image subtitle which will be used for social media images
     */
    generateExtraFields(siteInfo) {
        const prompt = GENERATE_EXTRA_FIELDS_PROMPT.replace("_SITE_URL_", siteInfo.url).replace("_SITE_TITLE_", siteInfo.title).replace("_SITE_DESCRIPTION_", siteInfo.description);
        return this.callAi(prompt);
    };
}

module.exports = new AI();