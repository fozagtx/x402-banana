import { GoogleGenAI, createPartFromBase64 } from 'npm:@google/genai';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { prompt, image1, image2, image1MimeType, image2MimeType } = await req.json();

    // Debug logging (truncate image data for readability)
    console.log('Request params:', {
      prompt,
      image1: image1 ? `${image1.substring(0, 50)}... (${image1.length} chars)` : null,
      image2: image2 ? `${image2.substring(0, 50)}... (${image2.length} chars)` : null,
      image1MimeType,
      image2MimeType,
    });

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Get API key from Supabase secrets
    const apiKey = Deno.env.get('VERTEX_AI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Initialize Google GenAI client with Vertex AI configuration
    const client = new GoogleGenAI({
      apiKey,
      vertexai: true,
      httpOptions: {
        apiVersion: 'v1',
        baseUrl: 'https://zenmux.ai/api/vertex-ai',
      },
    });

    // Prepare the content parts - images first, then prompt
    const contents: any[] = [];

    // Add optional images if provided (using createPartFromBase64)
    if (image1) {
      contents.push(
        createPartFromBase64(image1, image1MimeType || 'image/jpeg')
      );
    }

    if (image2) {
      contents.push(
        createPartFromBase64(image2, image2MimeType || 'image/jpeg')
      );
    }

    // Add prompt after images
    contents.push(prompt);

    // Generate content using the GenAI API
    const response = await client.models.generateContent({
      model: 'google/gemini-3-pro-image-preview',
      contents,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Error generating image:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate image' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
});
