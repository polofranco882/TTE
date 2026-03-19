
import { Router } from 'express';
import client from '../db';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const router = Router();
const SECRET = process.env.JWT_SECRET || 'secret';

// ─── Auth Middleware ─────────────────────────────────────────────────────────

const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const authenticateAdmin = (req: any, res: any, next: any) => {
    authenticateToken(req, res, () => {
        if (req.user.role !== 'admin') return res.sendStatus(403);
        next();
    });
};

// ─── GET /config — return AI config (admin only, api_key masked) ─────────────

router.get('/config', authenticateAdmin, async (req: any, res: any) => {
    try {
        const result = await client.query('SELECT * FROM ai_config ORDER BY id LIMIT 1');
        if (result.rows.length === 0) {
            return res.json(null);
        }
        const row = { ...result.rows[0] };
        // Mask the API key — never expose full key to frontend
        if (row.api_key) {
            const key = row.api_key as string;
            row.api_key_masked = key.length > 4 ? '****' + key.slice(-4) : '****';
        } else {
            row.api_key_masked = '';
        }
        delete row.api_key;
        res.json(row);
    } catch (error) {
        console.error('Error fetching AI config:', error);
        res.status(500).json({ message: 'Server error fetching AI config' });
    }
});

// ─── PUT /config — upsert AI config (admin only) ────────────────────────────

router.put('/config', authenticateAdmin, async (req: any, res: any) => {
    try {
        const {
            provider, api_key, model,
            allow_image, allow_video,
            max_seconds, max_resolution, max_size_mb
        } = req.body;

        // Check if a row exists
        const existing = await client.query('SELECT id, api_key FROM ai_config ORDER BY id LIMIT 1');

        if (existing.rows.length === 0) {
            // Insert
            await client.query(
                `INSERT INTO ai_config (provider, api_key, model, allow_image, allow_video, max_seconds, max_resolution, max_size_mb, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
                [provider || 'openai', api_key || '', model || 'gpt-image-1',
                allow_image !== false, allow_video !== false,
                max_seconds || 15, max_resolution || '1024x1024', max_size_mb || 10]
            );
        } else {
            // Update — if api_key is empty or null, keep the existing one
            const finalApiKey = api_key && api_key.trim() !== '' ? api_key : existing.rows[0].api_key;
            await client.query(
                `UPDATE ai_config SET
                    provider = $1, api_key = $2, model = $3,
                    allow_image = $4, allow_video = $5,
                    max_seconds = $6, max_resolution = $7, max_size_mb = $8,
                    updated_at = NOW()
                 WHERE id = $9`,
                [provider || 'openai', finalApiKey, model || 'gpt-image-1',
                allow_image !== false, allow_video !== false,
                max_seconds || 15, max_resolution || '1024x1024', max_size_mb || 10,
                existing.rows[0].id]
            );
        }

        res.json({ message: 'AI configuration saved successfully' });
    } catch (error) {
        console.error('Error saving AI config:', error);
        res.status(500).json({ message: 'Server error saving AI config' });
    }
});

// ─── POST /generate — generate an AI asset ──────────────────────────────────

router.post('/generate', authenticateToken, async (req: any, res: any) => {
    try {
        const { prompt, asset_type, source_asset_base64, html_current, insertion } = req.body;

        if (!prompt) {
            return res.status(400).json({
                status: 'error',
                error_code: 'INVALID_REQUEST',
                message: 'Prompt is required.',
                asset: null,
                html_snippet: null,
                html_updated: null
            });
        }

        // 1. Read config
        const configResult = await client.query('SELECT * FROM ai_config ORDER BY id LIMIT 1');
        if (configResult.rows.length === 0 || !configResult.rows[0].api_key || configResult.rows[0].api_key.trim() === '') {
            return res.json({
                status: 'error',
                error_code: 'PROVIDER_NOT_CONFIGURED',
                message: 'AI provider is not configured in admin settings.',
                required_admin_fields: ['provider', 'api_key'],
                asset: null,
                html_snippet: null,
                html_updated: null
            });
        }

        const config = configResult.rows[0];
        const requestedType = asset_type || 'image';

        // 2. Check policy
        if (requestedType === 'image' && !config.allow_image) {
            return res.json({
                status: 'error',
                error_code: 'FEATURE_DISABLED',
                message: 'Image generation is disabled by admin policy.',
                asset: null,
                html_snippet: null,
                html_updated: null
            });
        }
        if (requestedType === 'video' && !config.allow_video) {
            return res.json({
                status: 'error',
                error_code: 'FEATURE_DISABLED',
                message: 'Video generation is disabled by admin policy.',
                asset: null,
                html_snippet: null,
                html_updated: null
            });
        }

        // 3. Call provider
        let result: any;
        if (config.provider === 'openai') {
            result = await generateWithOpenAI(config, prompt, requestedType, source_asset_base64);
        } else if (config.provider === 'gemini') {
            result = await generateWithGemini(config, prompt, requestedType, source_asset_base64);
        } else {
            return res.json({
                status: 'error',
                error_code: 'PROVIDER_NOT_CONFIGURED',
                message: `Unknown provider: ${config.provider}`,
                required_admin_fields: ['provider', 'api_key'],
                asset: null,
                html_snippet: null,
                html_updated: null
            });
        }

        if (result.error) {
            return res.json({
                status: 'error',
                error_code: 'GENERATION_FAILED',
                message: result.error,
                asset: null,
                html_snippet: null,
                html_updated: null
            });
        }

        // 4. Build response
        // Layout type returns JSON directly, not media
        if (requestedType === 'layout' && result.layout) {
            return res.json({
                status: 'ok',
                asset_type: 'layout',
                layout: result.layout,
                asset: null,
                html_snippet: null,
                html_updated: null
            });
        }

        const now = new Date();
        const ts = now.toISOString().replace(/[-:T]/g, '').slice(0, 15);
        const rnd = Math.random().toString(36).slice(2, 8);
        const assetId = `${requestedType === 'video' ? 'vid' : 'img'}_${ts}_${rnd}`;

        const mime = result.mime || (requestedType === 'video' ? 'video/mp4' : 'image/png');
        const dataUri = `data:${mime};base64,${result.base64}`;

        let html_snippet = '';
        if (requestedType === 'video') {
            const posterAttr = result.poster_base64
                ? ` poster="data:${result.poster_mime || 'image/png'};base64,${result.poster_base64}"`
                : '';
            html_snippet = `<figure id="${assetId}"><video controls width="${result.width || 1024}" height="${result.height || 1024}"${posterAttr}><source src="${dataUri}" type="${mime}"></video><figcaption>${prompt}</figcaption></figure>`;
        } else {
            html_snippet = `<figure id="${assetId}"><img src="${dataUri}" alt="${prompt}" width="${result.width || 1024}" height="${result.height || 1024}" /><figcaption>${prompt}</figcaption></figure>`;
        }

        // Build html_updated if html_current was provided
        let html_updated: string | null = null;
        if (html_current) {
            const strategy = insertion?.insert_strategy || 'append';
            if (strategy === 'append') {
                html_updated = html_current + '\n' + html_snippet;
            } else {
                html_updated = html_current + '\n' + html_snippet;
            }
        }

        const response: any = {
            status: 'ok',
            asset_type: requestedType,
            mime,
            base64: result.base64,
            width: result.width || 1024,
            height: result.height || 1024,
            asset_id_suggested: assetId,
            title: prompt.slice(0, 60),
            description: `AI-generated ${requestedType} from prompt: "${prompt.slice(0, 80)}"`,
            tags: ['ai-generated', requestedType, config.provider],
            insert_strategy: insertion?.insert_strategy || 'append',
            target_selector: insertion?.target_selector || null,
            html_snippet,
            html_updated,
            db_record_suggestion: {
                id: assetId,
                mime,
                base64: result.base64,
                created_at: now.toISOString(),
                source_asset_id: source_asset_base64 ? 'provided' : null,
                provider_used: config.provider,
                model_used: config.model,
                prompt_hash: simpleHash(prompt),
                width: result.width || 1024,
                height: result.height || 1024
            }
        };

        if (requestedType === 'video') {
            response.duration_seconds = result.duration_seconds || null;
            response.poster_image_base64 = result.poster_base64 || null;
            response.poster_mime = result.poster_mime || null;
        }

        res.json(response);

    } catch (error: any) {
        console.error('AI Generate error:', error);
        res.status(500).json({
            status: 'error',
            error_code: 'INTERNAL_ERROR',
            message: error.message || 'Internal server error during generation.',
            asset: null,
            html_snippet: null,
            html_updated: null
        });
    }
});

// ─── Provider Implementations ───────────────────────────────────────────────

async function generateWithOpenAI(config: any, prompt: string, assetType: string, sourceBase64?: string) {
    try {
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey: config.api_key });

        if (assetType === 'image') {
            const params: any = {
                model: config.model || 'gpt-image-1',
                prompt,
                n: 1,
                size: config.max_resolution || '1024x1024',
            };

            // If source image provided, use edits endpoint
            if (sourceBase64) {
                // For image edits, we need to convert base64 to a Buffer
                const imageBuffer = Buffer.from(sourceBase64, 'base64');
                const response = await openai.images.edit({
                    model: config.model || 'gpt-image-1',
                    image: new File([imageBuffer], 'source.png', { type: 'image/png' }),
                    prompt,
                    size: config.max_resolution || '1024x1024' as any,
                });
                const b64 = response.data?.[0]?.b64_json;
                if (!b64) {
                    return { error: 'OpenAI returned no image data from edit.' };
                }
                const [w, h] = (config.max_resolution || '1024x1024').split('x').map(Number);
                return { base64: b64, mime: 'image/png', width: w, height: h };
            }

            // Standard generation
            const response = await openai.images.generate({
                ...params,
                response_format: 'b64_json',
            });

            const b64 = response.data?.[0]?.b64_json;
            if (!b64) {
                return { error: 'OpenAI returned no image data.' };
            }
            const [w, h] = (config.max_resolution || '1024x1024').split('x').map(Number);
            return { base64: b64, mime: 'image/png', width: w, height: h };
        }

        // Video not natively supported by OpenAI images API
        return { error: 'Video generation is not supported by OpenAI provider at this time. Use image generation instead.' };

    } catch (err: any) {
        console.error('OpenAI error:', err);
        return { error: err.message || 'OpenAI API call failed.' };
    }
}

async function generateWithGemini(config: any, prompt: string, assetType: string, sourceBase64?: string) {
    try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: config.api_key });

        if (assetType === 'image') {
            const contents: any[] = [];

            if (sourceBase64) {
                contents.push({
                    inlineData: {
                        mimeType: 'image/png',
                        data: sourceBase64,
                    },
                });
            }
            contents.push({ text: prompt });

            const response = await ai.models.generateContent({
                model: config.model || 'gemini-2.0-flash-exp',
                contents,
                config: {
                    responseModalities: ['TEXT', 'IMAGE'],
                },
            });

            // Look for the image part in candidates
            const candidates = response.candidates;
            if (candidates && candidates.length > 0) {
                const parts = candidates[0].content?.parts || [];
                for (const part of parts) {
                    if (part.inlineData && part.inlineData.data) {
                        const mime = part.inlineData.mimeType || 'image/png';
                        return {
                            base64: part.inlineData.data,
                            mime,
                            width: 1024,
                            height: 1024
                        };
                    }
                }
            }

            return { error: 'Gemini returned no image data.' };
        }

        // ── VIDEO GENERATION via Veo ────────────────────────────────────────
        if (assetType === 'video') {
            console.log('Starting Gemini video generation with Veo...');

            const videoParams: any = {
                model: 'veo-3.1-generate-preview',
                prompt: prompt,
                config: {
                    aspectRatio: '16:9',
                    numberOfVideos: 1,
                },
            };

            if (sourceBase64) {
                let imageData = sourceBase64;
                if (imageData.includes(',')) {
                    imageData = imageData.split(',')[1];
                }
                videoParams.image = {
                    imageBytes: imageData,
                    mimeType: 'image/png'
                };
            }

            // Start the long-running video generation
            let operation: any = await ai.models.generateVideos(videoParams);

            console.log('generateVideos response keys:', Object.keys(operation || {}));
            console.log('generateVideos response:', JSON.stringify(operation, null, 2).slice(0, 1000));

            // If the result already has generated videos directly (no polling needed)
            if (operation?.generatedVideos && operation.generatedVideos.length > 0) {
                const video = operation.generatedVideos[0].video;
                if (video?.uri) {
                    console.log('Video ready immediately, downloading from:', video.uri);
                    const videoResponse = await fetch(video.uri);
                    if (!videoResponse.ok) {
                        return { error: `Failed to download video: ${videoResponse.statusText}` };
                    }
                    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
                    return {
                        base64: videoBuffer.toString('base64'),
                        mime: 'video/mp4',
                        width: 1280,
                        height: 720,
                        duration_seconds: 8,
                    };
                }
            }

            // Poll until the operation completes (max ~5 minutes)
            if (!operation?.name) {
                console.error('No operation name in response:', JSON.stringify(operation, null, 2).slice(0, 2000));
                return { error: 'Video generation started but no operation name returned.' };
            }

            console.log('Video generation started. Operation name:', operation.name);

            const videoTimeout = Math.max(config.max_seconds || 300, 300); // min 5 minutes for video
            const maxWaitMs = videoTimeout * 1000;
            const startTime = Date.now();
            const pollIntervalMs = 10000; // 10s between polls

            while (!operation.done) {
                if (Date.now() - startTime > maxWaitMs) {
                    return { error: `Video generation timed out after ${config.max_seconds || 300}s.` };
                }

                await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

                // SDK expects the full operation OBJECT, not a string
                operation = await (ai.operations as any).get({ operation: operation });
                console.log(`Polling video... done=${operation?.done}`);
            }

            // Extract the generated video
            const generatedVideos = operation.response?.generatedVideos || operation.generatedVideos;
            if (!generatedVideos || generatedVideos.length === 0) {
                return { error: 'Gemini Veo returned no video data.' };
            }

            const video = generatedVideos[0].video;
            if (!video || !video.uri) {
                return { error: 'Gemini Veo video has no URI.' };
            }

            // Download the video from the URI and convert to base64
            // The URI requires the API key for authentication
            const downloadUrl = video.uri.includes('?')
                ? `${video.uri}&key=${config.api_key}`
                : `${video.uri}?key=${config.api_key}`;
            console.log('Downloading generated video...');
            const videoResponse = await fetch(downloadUrl);
            if (!videoResponse.ok) {
                return { error: `Failed to download video: ${videoResponse.statusText}` };
            }

            const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
            const videoBase64 = videoBuffer.toString('base64');

            return {
                base64: videoBase64,
                mime: 'video/mp4',
                width: 1280,
                height: 720,
                duration_seconds: 8,
            };
        }

        // ── LAYOUT GENERATION via Gemini Vision ─────────────────────────────
        if (assetType === 'layout') {
            if (!sourceBase64) {
                return { error: 'A reference image is required for layout generation.' };
            }

            console.log('Starting Gemini layout generation from reference image...');

            // Remove data URI prefix if present, but keep the full data URI for the canvas
            let imageData = sourceBase64;
            let imageDataUri = sourceBase64;
            if (imageData.includes(',')) {
                imageData = imageData.split(',')[1];
            }
            // Ensure we have a proper data URI for the canvas background
            if (!imageDataUri.startsWith('data:')) {
                imageDataUri = `data:image/png;base64,${imageData}`;
            }

            const layoutPrompt = `Act as a Duolingo-style educational page generator.

OBJECTIVE
- Generate a NEW interactive web page based on the attached image.
- The activity must be answerable within the page (inputs, selection, etc.) and validated with immediate feedback.

INPUT
- You will receive 1 image (the original activity).
- You must interpret its content and convert it into an equivalent interactive experience, without changing the pedagogical intent.

MANDATORY OUTPUT (DELIVERABLE)
Return ONLY:
1) A complete HTML file (with embedded CSS and JS) ready to paste and run.
2) Include everything in a single file (no external dependencies).
3) The page must be responsive (mobile and desktop).
4) DO NOT return markdown, DO NOT use backticks, ONLY the HTML code from <!DOCTYPE html> to </html>.

DESIGN REQUIREMENTS (DUOLINGO STYLE)
- Clean, modern, friendly UI.
- Top progress (bar or steps).
- Cards for each question.
- Buttons: "Check", "Next", "Retry".
- Visual states: correct/incorrect (with short messages).
- Smooth animations (without overdoing it).
- Use a dark or modern background color (#1a1a2e, #0f1129) or one that matches the image.

FUNCTIONAL REQUIREMENTS OF THE ACTIVITY
- Exactly reproduce the type of exercise from the image:
  - If there are blanks: use text fields.
  - If there are options: use single or multiple selection.
  - If there is a "match": use select dropdowns or buttons to pair.
  - If there is ordering: move buttons or inputs.
- There must be validation:
  - When pressing "Check", mark each item as correct/incorrect.
  - Show feedback per question and a total result.
- There must be a "Show answers" button (optional) but protected behind an additional click (confirmation).

IMAGE WITHIN THE SHEET (ADJUSTMENT + IMPROVE RESOLUTION)
- Insert the original image as a "reference" within the page.
- Use EXACTLY this cropped base64 in the main image src: {REFERENCE_IMAGE_DATA_URI}
- The image must fit the container width without deforming.
- Allow zoom (+/– buttons or slider) and "Open large" (modal).
- Visually improve the image using browser techniques (JS + embedded Canvas):
  - Use canvas to apply slight sharpening and contrast increase when loading.

DATA AND ANSWERS
- Extract from the image content: Questions, Options, and Correct answers.
- Store those answers in an embedded JS object (answerKey).
- DO NOT invent new questions if not necessary; only make interactive what is seen in the image.

RESTRICTIONS
- No external links, no frameworks, no CDNs (use Vanilla JS and plain CSS).
- Everything must work offline.
- Do not include explanations: deliver the final HTML directly.

Additional user instructions: ${prompt}`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash', // Layout always uses vision-capable model
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                inlineData: {
                                    mimeType: 'image/png',
                                    data: imageData,
                                },
                            },
                            { text: layoutPrompt },
                        ],
                    },
                ],
            });

            const text = response.text || '';
            console.log('Gemini HTML layout response length:', text.length);

            // Extract HTML from response (handle possible markdown fences)
            let htmlStr = text.trim();
            if (htmlStr.startsWith('\`\`\`html')) {
                htmlStr = htmlStr.replace(/^\`\`\`(?:html)?\n?/, '').replace(/\n?\`\`\`$/, '');
            } else if (htmlStr.startsWith('\`\`\`')) {
                htmlStr = htmlStr.replace(/^\`\`\`\n?/, '').replace(/\n?\`\`\`$/, '');
            }

            // Inject the actual data URI image in place of the placeholder if the AI used it
            htmlStr = htmlStr.replace(/{REFERENCE_IMAGE_DATA_URI}/g, imageDataUri);

            if (!htmlStr.includes('<html') && !htmlStr.includes('<body')) {
                return { error: 'AI did not return a valid HTML document.' };
            }

            return { layout: { isHtml: true, content: htmlStr } };
        }

        return { error: `Unsupported asset type: ${assetType}` };

    } catch (err: any) {
        console.error('Gemini error:', err);
        return { error: err.message || 'Gemini API call failed.' };
    }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

export default router;
